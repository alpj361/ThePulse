import { supabase } from './supabase';
import {
  ColumnRelationship,
  ResolvedRelationship,
  RelationshipMatchingStrategy
} from '../types/datasetEditor';
import {
  parseListValues,
  normalizeKey,
  calculateSimilarity
} from '../utils/dataUtils';

/**
 * Cache for resolved relationships
 * Key: `${sourceDatasetId}:${sourceColumn}:${targetDatasetId}:${targetColumn}`
 * Value: Map of sourceValue -> ResolvedRelationship
 */
const relationshipCache = new Map<string, Map<string, ResolvedRelationship>>();

/**
 * Cache TTL: 5 minutes
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Clear cache for a specific relationship
 */
export const clearRelationshipCache = (
  sourceDatasetId: string,
  sourceColumn: string,
  targetDatasetId: string,
  targetColumn: string
): void => {
  const cacheKey = `${sourceDatasetId}:${sourceColumn}:${targetDatasetId}:${targetColumn}`;
  relationshipCache.delete(cacheKey);
};

/**
 * Main relationship resolution function
 * Resolves a value from source dataset to target dataset using configured strategy
 */
export const resolveRelationship = async (
  sourceValue: any,
  sourceDatasetId: string,
  sourceColumn: string,
  relationship: ColumnRelationship,
  targetData?: any[] // Optional: pass pre-loaded target data for performance
): Promise<ResolvedRelationship> => {
  // Handle null/undefined
  if (sourceValue === null || sourceValue === undefined) {
    return {
      matched: false,
      strategy: relationship.matchingStrategy,
      confidence: 0,
      sourceValue: null,
      targetValue: null
    };
  }

  // Load target dataset if not provided
  let targetRows = targetData;
  if (!targetRows) {
    console.log('🔗 Loading target dataset:', relationship.targetDatasetId);

    const { data, error } = await supabase
      .from('private_datasets')
      .select('json_data')
      .eq('id', relationship.targetDatasetId)
      .single();

    if (error || !data) {
      console.error('Failed to load target dataset:', {
        targetDatasetId: relationship.targetDatasetId,
        error: error?.message || 'No data returned',
        errorCode: error?.code,
        details: error?.details
      });
      return {
        matched: false,
        strategy: relationship.matchingStrategy,
        confidence: 0,
        sourceValue,
        targetValue: null
      };
    }

    console.log('✅ Target dataset loaded, rows:', data.json_data?.length || 0);
    targetRows = data.json_data;
  }

  // Parse comma-separated values if needed
  const sourceValues = parseListValues(sourceValue);
  const results: ResolvedRelationship[] = [];

  // Resolve each value
  for (const singleValue of sourceValues) {
    const result = await resolveSingleValue(
      singleValue,
      relationship,
      targetRows
    );
    results.push(result);
  }

  // If multiple results, combine them
  if (results.length === 0) {
    return {
      matched: false,
      strategy: relationship.matchingStrategy,
      confidence: 0,
      sourceValue,
      targetValue: null
    };
  } else if (results.length === 1) {
    return results[0];
  } else {
    // Multiple matches - return as array
    return {
      matched: results.some(r => r.matched),
      strategy: relationship.matchingStrategy,
      confidence: Math.max(...results.map(r => r.confidence)),
      sourceValue,
      targetValue: results
        .filter(r => r.matched)
        .map(r => r.targetValue)
    };
  }
};

/**
 * Resolve a single value (not comma-separated)
 * Now handles target cells that may contain multiple values (comma/semicolon separated)
 */
const resolveSingleValue = async (
  sourceValue: any,
  relationship: ColumnRelationship,
  targetRows: any[]
): Promise<ResolvedRelationship> => {
  const targetColumn = relationship.targetColumnName;

  // Strategy 1: ID matching (highest priority)
  if (relationship.matchingStrategy === 'id') {
    const numericValue = Number(sourceValue);
    if (!isNaN(numericValue)) {
      const match = targetRows.find(row => Number(row[targetColumn]) === numericValue);
      if (match) {
        return {
          matched: true,
          strategy: 'id',
          confidence: 1.0,
          sourceValue,
          targetValue: match[targetColumn],
          targetRow: match
        };
      }
    }
  }

  // Strategy 2: Exact string match (also checks within comma-separated values)
  if (relationship.matchingStrategy === 'name_exact') {
    const sourceStr = String(sourceValue);

    for (const row of targetRows) {
      const targetCellValue = row[targetColumn];
      // Parse target cell value to handle multiple names in one cell
      const targetValues = parseListValues(targetCellValue);

      // Check if source matches any of the target values exactly
      if (targetValues.some(tv => tv === sourceStr)) {
        return {
          matched: true,
          strategy: 'name_exact',
          confidence: 1.0,
          sourceValue,
          targetValue: row[targetColumn],
          targetRow: row
        };
      }
    }
  }

  // Strategy 3: Normalized string match (handles accents, case, multiple names in cell)
  if (relationship.matchingStrategy === 'name_normalized') {
    const normalizedSource = normalizeKey(String(sourceValue));

    for (const row of targetRows) {
      const targetCellValue = row[targetColumn];
      // Parse target cell value to handle multiple names in one cell
      const targetValues = parseListValues(targetCellValue);

      // Check if normalized source matches any normalized target value
      if (targetValues.some(tv => normalizeKey(tv) === normalizedSource)) {
        return {
          matched: true,
          strategy: 'name_normalized',
          confidence: 0.95,
          sourceValue,
          targetValue: row[targetColumn],
          targetRow: row
        };
      }
    }

    // Also try partial matching: check if source name is CONTAINED in a target name
    // This handles cases like "Ervin Maldonado" matching "Ervin Adim Maldonado Molina"
    for (const row of targetRows) {
      const targetCellValue = row[targetColumn];
      const targetValues = parseListValues(targetCellValue);

      for (const tv of targetValues) {
        const normalizedTarget = normalizeKey(tv);
        // Check if one contains the other (helpful for partial names)
        if (normalizedTarget.includes(normalizedSource) || normalizedSource.includes(normalizedTarget)) {
          // Lower confidence for partial matches
          return {
            matched: true,
            strategy: 'name_normalized',
            confidence: 0.85,
            sourceValue,
            targetValue: row[targetColumn],
            targetRow: row
          };
        }
      }
    }
  }

  // Strategy 4: Fuzzy matching (also checks within comma-separated values)
  if (relationship.matchingStrategy === 'fuzzy') {
    const threshold = relationship.fuzzyThreshold || 0.85;
    const normalizedSource = normalizeKey(String(sourceValue));

    let bestMatch: any = null;
    let bestScore = 0;

    for (const row of targetRows) {
      const targetCellValue = row[targetColumn];
      // Parse target cell value to handle multiple names in one cell
      const targetValues = parseListValues(targetCellValue);

      for (const tv of targetValues) {
        const normalizedTarget = normalizeKey(tv);
        const similarity = calculateSimilarity(normalizedSource, normalizedTarget);

        if (similarity > bestScore && similarity >= threshold) {
          bestScore = similarity;
          bestMatch = row;
        }
      }
    }

    if (bestMatch) {
      return {
        matched: true,
        strategy: 'fuzzy',
        confidence: bestScore,
        sourceValue,
        targetValue: bestMatch[targetColumn],
        targetRow: bestMatch
      };
    }
  }

  // No match found
  return {
    matched: false,
    strategy: relationship.matchingStrategy,
    confidence: 0,
    sourceValue,
    targetValue: null
  };
};

/**
 * Bulk resolve relationships for an entire dataset
 * Optimized for batch processing
 */
export const resolveRelationshipsForDataset = async (
  sourceDatasetId: string,
  sourceData: any[],
  columnRelationships: { columnName: string; relationship: ColumnRelationship }[]
): Promise<Map<string, Map<string, ResolvedRelationship>>> => {
  // Result: Map of columnName -> Map of rowValue -> ResolvedRelationship
  const results = new Map<string, Map<string, ResolvedRelationship>>();

  // Pre-load all target datasets once
  const targetDataCache = new Map<string, any[]>();
  for (const { relationship } of columnRelationships) {
    if (!targetDataCache.has(relationship.targetDatasetId)) {
      const { data } = await supabase
        .from('private_datasets')
        .select('json_data')
        .eq('id', relationship.targetDatasetId)
        .single();

      if (data?.json_data) {
        targetDataCache.set(relationship.targetDatasetId, data.json_data);
      }
    }
  }

  // Resolve each column's relationships
  for (const { columnName, relationship } of columnRelationships) {
    const columnResults = new Map<string, ResolvedRelationship>();
    const targetData = targetDataCache.get(relationship.targetDatasetId);

    if (!targetData) continue;

    // Resolve each row
    for (const row of sourceData) {
      const sourceValue = row[columnName];
      const resolved = await resolveRelationship(
        sourceValue,
        sourceDatasetId,
        columnName,
        relationship,
        targetData
      );

      columnResults.set(String(sourceValue), resolved);
    }

    results.set(columnName, columnResults);
  }

  return results;
};
