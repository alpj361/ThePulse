/**
 * Helper function to parse values that might be lists (comma-separated or semicolon-separated strings or arrays)
 * Used for matching values across datasets (e.g. "Name1, Name2" finding "Name1")
 */
export const parseListValues = (value: any): string[] => {
    if (value === null || value === undefined) {
        return [];
    }

    // If it's already an array, just return it as string array
    if (Array.isArray(value)) {
        return value.map(v => String(v).trim()).filter(v => v.length > 0);
    }

    // If it's a string, try to split by comma or semicolon
    if (typeof value === 'string') {
        // First check for semicolon (common in name lists like "Juan García; Pedro López")
        if (value.includes(';')) {
            return value.split(';').map(v => v.trim()).filter(v => v.length > 0);
        }
        // Then check for comma
        if (value.includes(',')) {
            return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
        }
        // If just a single string but not empty
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }

    // Fallback for number or other types
    return [String(value)];
};

/**
 * Normalize a string for matching:
 * - Convert to lowercase
 * - Remove accents/diacritics
 * - Normalize whitespace
 * - Trim
 *
 * Used for case-insensitive, accent-insensitive name matching
 * Example: "JOSÉ García" → "jose garcia"
 */
export const normalizeKey = (value: string): string => {
    return value
        .toLowerCase()
        .normalize('NFD')                          // Unicode decomposition
        .replace(/[\u0300-\u036f]/g, '')          // Remove diacritics
        .trim()
        .replace(/\s+/g, ' ');                     // Normalize whitespace
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to find similar strings
 *
 * @param a First string
 * @param b Second string
 * @returns Number of single-character edits (insertions, deletions, substitutions)
 */
export const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Calculate similarity score (0.0-1.0) based on Levenshtein distance
 * Higher score = more similar strings
 *
 * @param a First string
 * @param b Second string
 * @returns Similarity score from 0.0 (completely different) to 1.0 (identical)
 */
export const calculateSimilarity = (a: string, b: string): number => {
    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
};
