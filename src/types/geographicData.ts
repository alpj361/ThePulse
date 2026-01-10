/**
 * Types for geographic data integration with datasets
 */

import { Dataset } from '../services/datasets';

/**
 * Represents enriched data for a geographic location
 */
export interface GeographicLocationData {
    departamento: string;
    municipio?: string;
    datasets: GeographicDatasetMatch[];
    actors: ActorData[];
    statistics: Record<string, any>;
    hasData: boolean;
    /** If true, this data was aggregated from multiple municipalities */
    isAggregated?: boolean;
    /** Number of municipalities this data was aggregated from */
    municipalityCount?: number;
    /** List of municipality names included in aggregation */
    aggregatedFrom?: string[];
}

/**
 * Dataset that matches a geographic location
 */
export interface GeographicDatasetMatch {
    datasetId: string;
    datasetName: string;
    matchedRows: any[];
    dataTypes: DetectedDataType[];
}

/**
 * Detected data type in a dataset
 */
export interface DetectedDataType {
    type: 'actor' | 'numeric' | 'text' | 'location' | 'entity' | 'money';
    columnName: string;
    displayName?: string;
    value: any;
}

/**
 * Actor/Person data with optional photo
 */
export interface ActorData {
    name: string;
    role?: string; // e.g., "Alcalde", "Gobernador"
    party?: string;
    photoUrl?: string;
    metadata?: Record<string, any>;
    sourceDataset: string;
}

/**
 * Index of geographic data
 * Structure: { "Guatemala": { "Guatemala": GeographicLocationData } }
 */
export interface GeographicDataIndex {
    [departamento: string]: {
        [municipio: string]: GeographicLocationData;
    };
}

/**
 * Configuration for geographic column detection
 */
export interface GeographicColumnConfig {
    departmentColumns: string[];
    municipalityColumns: string[];
    cityColumns: string[];
}

/**
 * Result of scanning a dataset for geographic data
 */
export interface DatasetScanResult {
    dataset: Dataset;
    hasGeographicData: boolean;
    departmentColumn?: string;
    municipalityColumn?: string;
    /** Columns with schema type 'location' (structured LocationValue objects) */
    locationColumns: string[];
    actorColumns: string[];
    rowCount: number;
}
