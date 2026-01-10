/**
 * Service for indexing and querying geographic data from datasets
 */

import { datasetsService, Dataset } from './datasets';
import {
    GeographicDataIndex,
    GeographicLocationData,
    GeographicDatasetMatch,
    ActorData,
    DetectedDataType,
    DatasetScanResult,
    GeographicColumnConfig
} from '../types/geographicData';
import { DATASETS_CONFIG } from '../config/datasets';

// Configuration for detecting geographic columns
const GEO_COLUMN_CONFIG: GeographicColumnConfig = {
    departmentColumns: ['departamento', 'department', 'depto', 'dept'],
    municipalityColumns: ['municipio', 'municipality', 'muni', 'ciudad', 'city'],
    cityColumns: ['ciudad', 'city', 'municipio', 'municipality']
};

// Actor/Person column indicators
const ACTOR_INDICATORS = [
    'alcalde', 'mayor', 'gobernador', 'governor',
    'nombre', 'name', 'actor', 'persona', 'person',
    'presidente', 'director', 'jefe', 'responsable'
];

// Cache for the geographic index
let cachedIndex: GeographicDataIndex | null = null;
let lastIndexTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize string for comparison (lowercase, trim, remove accents)
 */
function normalizeString(str: string): string {
    if (!str) return '';
    const normalized = str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    // console.log(`🔤 Normalize: "${str}" -> "${normalized}"`);
    return normalized;
}

/**
 * Check if a column name matches geographic patterns
 */
function matchesGeographicColumn(columnName: string, patterns: string[]): boolean {
    const normalized = normalizeString(columnName);
    const match = patterns.some(pattern => normalized.includes(pattern));
    if (match) {
        // console.log(`🎯 Column match: "${columnName}" matches pattern in [${patterns}]`);
    }
    return match;
}

/**
 * Detect if a column contains actor/person data
 */
function isActorColumn(columnName: string): boolean {
    const normalized = normalizeString(columnName);
    return ACTOR_INDICATORS.some(indicator => normalized.includes(indicator));
}

/**
 * Extract a location field from a value (handles both strings and LocationValue objects)
 * @param value - Can be a string or a LocationValue object
 * @param fields - List of field names to try extracting from objects
 * @returns The extracted string value or null
 */
function extractLocationField(value: any, ...fields: string[]): string | null {
    // Handle null/undefined
    if (value === null || value === undefined) return null;

    // Handle string values directly
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || null;
    }

    // Handle object values (LocationValue)
    if (typeof value === 'object') {
        // Try each field name
        for (const field of fields) {
            // Check if field exists in object (even if empty)
            if (field in value) {
                const fieldValue = value[field];
                // Return the value if it's a non-empty string
                if (fieldValue && typeof fieldValue === 'string') {
                    return fieldValue.trim() || null;
                }
                // If field exists but is empty/null, return null (DON'T fallback)
                // This prevents formatted_address from being used for municipality when municipality is intentionally empty
                return null;
            }
        }

        // Only use fallback fields if NONE of the requested fields exist in the object
        const fallbackFields = ['formatted_address', 'name', 'label'];
        for (const field of fallbackFields) {
            if (value[field] && typeof value[field] === 'string') {
                // For formatted_address, extract first part (usually municipality)
                if (field === 'formatted_address') {
                    const parts = value[field].split(',');
                    return parts[0]?.trim() || null;
                }
                return value[field].trim() || null;
            }
        }
    }

    return null;
}

/**
 * Detect the type of data in a column
 */
function detectColumnType(columnName: string, value: any, schemaType?: string): DetectedDataType['type'] {
    // Check schema type first
    if (schemaType) {
        if (schemaType === 'actor' || schemaType === 'entity') return 'actor';
        if (schemaType === 'location') return 'location';
        if (schemaType === 'money') return 'money';
        if (schemaType === 'number') return 'numeric';
    }

    // Check column name patterns
    if (isActorColumn(columnName)) return 'actor';

    // Check value type
    if (typeof value === 'number') return 'numeric';
    if (typeof value === 'object' && value !== null) {
        if ('name' in value || 'label' in value) return 'actor';
        if ('lat' in value || 'lng' in value) return 'location';
        if ('amount' in value || 'currency' in value) return 'money';
    }

    return 'text';
}

/**
 * Scan a dataset to detect geographic columns and data types
 */
function scanDataset(dataset: Dataset): DatasetScanResult {
    const result: DatasetScanResult = {
        dataset,
        hasGeographicData: false,
        locationColumns: [],
        actorColumns: [],
        rowCount: dataset.row_count
    };

    // Check schema for geographic columns
    const schema = dataset.schema_definition || [];

    for (const column of schema) {
        const columnName = column.name;

        // NEW: Check for columns with type 'location' (structured LocationValue objects)
        if (column.type === 'location') {
            result.locationColumns.push(columnName);
            result.hasGeographicData = true;
            continue;
        }

        // Check for department column by name pattern
        if (matchesGeographicColumn(columnName, GEO_COLUMN_CONFIG.departmentColumns)) {
            result.departmentColumn = columnName;
            result.hasGeographicData = true;
        }

        // Check for municipality column by name pattern
        if (matchesGeographicColumn(columnName, GEO_COLUMN_CONFIG.municipalityColumns)) {
            result.municipalityColumn = columnName;
            result.hasGeographicData = true;
        }

        // Check for actor columns (exclude party columns - they're related fields, not actors)
        const normalizedName = normalizeString(columnName);
        const isPartyColumn = normalizedName.includes('partido') || normalizedName.includes('party');
        if (!isPartyColumn && (isActorColumn(columnName) || column.type === 'actor' || column.type === 'entity')) {
            result.actorColumns.push(columnName);
        }
    }

    return result;
}

/**
 * Extract actor data from a row
 */
function extractActorData(
    row: any,
    actorColumns: string[],
    datasetName: string
): ActorData[] {
    const actors: ActorData[] = [];

    for (const columnName of actorColumns) {
        const value = row[columnName];
        if (!value) continue;

        let actorData: ActorData = {
            name: '',
            sourceDataset: datasetName
        };

        // Handle different value types
        if (typeof value === 'string') {
            actorData.name = value;
        } else if (typeof value === 'object' && value !== null) {
            // Handle Actor/Entity type objects
            actorData.name = value.name || value.label || '';
            actorData.photoUrl = value.image_url || value.imageUrl || value.photo;
            actorData.metadata = value;
        }

        // Use column name directly as the role (e.g., "Alcalde", "Gobernador", etc.)
        actorData.role = columnName;

        // Note: Party data should come from the actor object itself if it exists
        // Do NOT extract from hardcoded row.Partido - let the correlation be explicit

        if (actorData.name) {
            actors.push(actorData);
        }
    }

    return actors;
}

/**
 * Build geographic data index from public datasets
 */
export async function buildGeographicIndex(): Promise<GeographicDataIndex> {
    const index: GeographicDataIndex = {};

    try {
        // Get all public datasets from Supabase
        const datasets = await datasetsService.listDatasets({ visibility: 'public' });

        if (datasets.length === 0) {
            console.warn('⚠️ No public datasets found for geographic indexing');
            return index;
        }

        // Scan each dataset for geographic data
        for (const dataset of datasets) {
            const scanResult = scanDataset(dataset);

            if (!scanResult.hasGeographicData) {
                continue;
            }


            // Process each row in the dataset
            const rows = dataset.json_data || [];

            for (const row of rows) {
                let dept: string | null = null;
                let muni: string | null = null;

                // First, try to extract from explicit department/municipality columns
                if (scanResult.departmentColumn) {
                    dept = extractLocationField(
                        row[scanResult.departmentColumn],
                        'department', 'departamento', 'dept', 'depto'
                    );
                }
                if (scanResult.municipalityColumn) {
                    muni = extractLocationField(
                        row[scanResult.municipalityColumn],
                        'municipality', 'municipio', 'city', 'ciudad'
                    );
                }

                // NEW: If no dept/muni found, try to extract from location columns
                // Check ALL location columns, using column name to determine if it's dept or muni
                if (scanResult.locationColumns.length > 0) {
                    for (const locCol of scanResult.locationColumns) {
                        const locValue = row[locCol];
                        const normalizedColName = normalizeString(locCol);

                        // Determine if this column is for department or municipality based on column name
                        const isDeptColumn = GEO_COLUMN_CONFIG.departmentColumns.some(pattern =>
                            normalizedColName.includes(pattern)
                        );
                        const isMuniColumn = GEO_COLUMN_CONFIG.municipalityColumns.some(pattern =>
                            normalizedColName.includes(pattern)
                        );

                        if (locValue && typeof locValue === 'object') {
                            // If column name indicates department, extract department
                            if (isDeptColumn && !dept) {
                                dept = extractLocationField(locValue, 'department', 'departamento') ||
                                    extractLocationField(locValue, 'municipality', 'municipio') || // fallback for dept objects
                                    (typeof locValue === 'string' ? locValue : null);
                            }
                            // If column name indicates municipality, extract municipality  
                            if (isMuniColumn && !muni) {
                                muni = extractLocationField(locValue, 'municipality', 'municipio') ||
                                    (typeof locValue === 'string' ? locValue : null);
                            }
                            // If neither, try to extract both from the object (original behavior)
                            if (!isDeptColumn && !isMuniColumn) {
                                if (!dept) {
                                    dept = extractLocationField(locValue, 'department', 'departamento');
                                }
                                if (!muni) {
                                    muni = extractLocationField(locValue, 'municipality', 'municipio');
                                }
                            }
                        } else if (locValue && typeof locValue === 'string') {
                            // Handle string values in location columns
                            if (isDeptColumn && !dept) {
                                dept = locValue.trim();
                            }
                            if (isMuniColumn && !muni) {
                                muni = locValue.trim();
                            }
                        }
                    }

                    if (dept || muni) {
                        console.log(`🔍 Extracted from location columns:`, { dept, muni });
                    }
                }

                if (!dept) {
                    // Skip rows without geographic data
                    continue;
                }

                const deptKey = normalizeString(dept);
                const muniKey = muni ? normalizeString(muni) : '_department_level';

                // Initialize index structure
                if (!index[deptKey]) {
                    index[deptKey] = {};
                }
                if (!index[deptKey][muniKey]) {
                    index[deptKey][muniKey] = {
                        departamento: dept,
                        municipio: muni || undefined,
                        datasets: [],
                        actors: [],
                        statistics: {},
                        hasData: true
                    };
                }

                const locationData = index[deptKey][muniKey];
                console.log(`➕ Added to index: ${deptKey} / ${muniKey}`);

                // Add dataset match if not already added
                let datasetMatch = locationData.datasets.find(d => d.datasetId === dataset.id);
                if (!datasetMatch) {
                    datasetMatch = {
                        datasetId: dataset.id,
                        datasetName: dataset.name,
                        matchedRows: [],
                        dataTypes: []
                    };
                    locationData.datasets.push(datasetMatch);
                }
                datasetMatch.matchedRows.push(row);

                // Extract actor data
                if (scanResult.actorColumns.length > 0) {
                    const actors = extractActorData(row, scanResult.actorColumns, dataset.name);
                    locationData.actors.push(...actors);
                }

                // Collect other data types
                const schema = dataset.schema_definition || [];
                for (const column of schema) {
                    if (
                        column.name === scanResult.departmentColumn ||
                        column.name === scanResult.municipalityColumn
                    ) {
                        continue; // Skip geographic columns
                    }

                    const value = row[column.name];
                    if (value !== null && value !== undefined) {
                        const dataType: DetectedDataType = {
                            type: detectColumnType(column.name, value, column.type),
                            columnName: column.name,
                            displayName: column.name,
                            value
                        };

                        // Add to dataset match data types if not duplicate
                        if (!datasetMatch.dataTypes.some(dt => dt.columnName === column.name)) {
                            datasetMatch.dataTypes.push(dataType);
                        }
                    }
                }
            }
        }

        console.log(`✅ Geographic index built with ${Object.keys(index).length} departments`);

        // Cache the index
        cachedIndex = index;
        lastIndexTime = Date.now();

        return index;

    } catch (error) {
        console.error('❌ Error building geographic index:', error);
        return {};
    }
}

/**
 * Get geographic data for a specific location
 */
export async function getGeographicData(
    departamento: string,
    municipio?: string
): Promise<GeographicLocationData | null> {
    // Check cache validity
    const now = Date.now();
    if (!cachedIndex || (now - lastIndexTime) > CACHE_DURATION) {
        await buildGeographicIndex();
    }

    if (!cachedIndex) {
        return null;
    }

    const deptKey = normalizeString(departamento);
    const muniKey = municipio ? normalizeString(municipio) : '_department_level';

    // Check if department exists in index
    const deptData = cachedIndex[deptKey];

    // Strategy 1: Exact lookup
    let locationData = deptData?.[muniKey];

    // NOTE: Removed Strategy 2 (same-name municipality lookup) because it incorrectly
    // mixed municipality data (e.g., Alcalde de Guatemala) with department level data
    // when department and municipality have the same name

    // Strategy 2.5: Look for keys containing "(departamento)" pattern 
    // Some datasets index department-level data with keys like "chiquimula (departamento)"
    if (!locationData && muniKey === '_department_level' && deptData) {
        const deptPatternKey = Object.keys(deptData).find(k =>
            k.includes('(departamento)') || k.includes('(department)')
        );
        if (deptPatternKey) {
            locationData = deptData[deptPatternKey];
        }
    }

    // Strategy 3: If still not found and we're at department level, 
    // DON'T aggregate municipality data (keep levels separate)
    // Instead, return metadata about available municipality data
    if (!locationData && muniKey === '_department_level' && deptData) {
        const allMuniKeys = Object.keys(deptData).filter(k => k !== '_department_level');

        // Count data in municipalities WITHOUT aggregating it
        let totalMuniActors = 0;
        let totalMuniDatasets = 0;
        const muniNames: string[] = [];

        for (const mk of allMuniKeys) {
            const muniData = deptData[mk];
            if (muniData) {
                totalMuniActors += muniData.actors.length;
                totalMuniDatasets += muniData.datasets.length;
                if (muniData.municipio) {
                    muniNames.push(muniData.municipio);
                }
            }
        }

        // Only create a stub if there's municipality data (without including the actual data)
        if (totalMuniActors > 0 || totalMuniDatasets > 0) {
            locationData = {
                departamento: departamento,
                municipio: undefined,
                datasets: [], // Empty - no department-level datasets
                actors: [], // Empty - no department-level actors  
                statistics: {
                    municipalityActorCount: totalMuniActors,
                    municipalityDatasetCount: totalMuniDatasets
                },
                hasData: true,
                isAggregated: false, // Not aggregated - data is at municipality level
                municipalityCount: allMuniKeys.length,
                aggregatedFrom: muniNames
            };
        }
    }

    if (!locationData) {
        // Try department-level data if municipality not found
        if (municipio) {
            return cachedIndex[deptKey]?._department_level || null;
        }
        return null;
    }

    return locationData;
}

/**
 * Invalidate the cache (call when datasets are updated)
 */
export function invalidateCache(): void {
    cachedIndex = null;
    lastIndexTime = 0;
}

/**
 * Get statistics about the geographic index
 */
export function getIndexStats(): {
    departments: number;
    municipalities: number;
    totalLocations: number;
    datasetsIndexed: number;
    cacheAge: number;
} {
    if (!cachedIndex) {
        return {
            departments: 0,
            municipalities: 0,
            totalLocations: 0,
            datasetsIndexed: 0,
            cacheAge: 0
        };
    }

    let municipalities = 0;
    const datasetsSet = new Set<string>();

    for (const dept of Object.values(cachedIndex)) {
        municipalities += Object.keys(dept).length;
        for (const location of Object.values(dept)) {
            location.datasets.forEach(ds => datasetsSet.add(ds.datasetId));
        }
    }

    return {
        departments: Object.keys(cachedIndex).length,
        municipalities,
        totalLocations: municipalities,
        datasetsIndexed: datasetsSet.size,
        cacheAge: Date.now() - lastIndexTime
    };
}

export default {
    buildGeographicIndex,
    getGeographicData,
    invalidateCache,
    getIndexStats
};
