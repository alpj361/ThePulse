/**
 * Advanced Dataset Editor Types and Interfaces
 * Supports Money, Location, Actor, Entity, Company column types
 */

export type AdvancedColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'money'
  | 'location'
  | 'actor'
  | 'entity'
  | 'company';

export type Currency = 'GTQ' | 'USD' | 'EUR' | 'MXN';

export interface MoneyValue {
  amount: number | null;
  currency: Currency;
}

export interface LocationValue {
  department?: string;
  municipality?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  formatted_address?: string;
  // Boundary level support
  boundary_id?: string; // ID from GeoJSON
  boundary_type?: 'departamento' | 'municipio' | 'place'; // Type of boundary or place
  geometry?: any; // Full GeoJSON geometry for boundary areas
  is_boundary?: boolean; // True if administrative boundary, false if place
  geocode_failed?: boolean; // True if geocoding failed - no match found
}

export interface ActorValue {
  id?: string;
  name: string;
  type?: 'person' | 'organization';
  entity_id?: string; // Link to existing entity
}

export interface EntityValue {
  id?: string;
  name: string;
  type?: 'government' | 'ngo' | 'institution' | 'political_party';
  description?: string;
}

export interface CompanyValue {
  id?: string;
  name: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  location?: LocationValue;
}

export interface AdvancedColumnConfig {
  id: string;
  title: string;
  type: AdvancedColumnType;
  minWidth?: number;
  // Money column specific
  defaultCurrency?: Currency;
  // Location column specific
  searchScope?: 'guatemala' | 'worldwide';
  locationType?: 'boundary' | 'coordinates'; // Límites vs Ubicación Específica
  boundaryLevel?: 'level1' | 'level2'; // Nivel 1 (Departamento) or Nivel 2 (Municipio)
  coordinatesColumn?: string; // Columna que contiene las coordenadas (para locationType='coordinates')
  // Entity linking
  allowCreateNew?: boolean;
  linkedTable?: 'entities' | 'actors' | 'companies';
}

export interface DatasetRow {
  id: string;
  [key: string]: any | MoneyValue | LocationValue | ActorValue | EntityValue | CompanyValue;
}

export interface DatasetEditState {
  data: DatasetRow[];
  columns: AdvancedColumnConfig[];
  metadata: {
    name: string;
    description: string;
    tags: string[];
  };
  hasChanges: boolean;
}

// Currency formatting utilities
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GTQ: 'Q',
  USD: '$',
  EUR: '€',
  MXN: '$'
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  GTQ: 'Quetzal Guatemalteco',
  USD: 'US Dollar',
  EUR: 'Euro',
  MXN: 'Peso Mexicano'
};

// Default column configurations
export const DEFAULT_COLUMN_CONFIGS: Record<AdvancedColumnType, Partial<AdvancedColumnConfig>> = {
  text: { minWidth: 120 },
  number: { minWidth: 100 },
  date: { minWidth: 140 },
  checkbox: { minWidth: 80 },
  money: {
    minWidth: 150,
    defaultCurrency: 'GTQ'
  },
  location: {
    minWidth: 200,
    searchScope: 'guatemala',
    locationType: 'boundary', // Default to boundary selection
    boundaryLevel: 'level2', // Default to municipality level
    allowCreateNew: false
  },
  actor: {
    minWidth: 180,
    linkedTable: 'actors',
    allowCreateNew: true
  },
  entity: {
    minWidth: 180,
    linkedTable: 'entities',
    allowCreateNew: true
  },
  company: {
    minWidth: 180,
    linkedTable: 'companies',
    allowCreateNew: true
  }
};