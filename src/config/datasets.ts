/**
 * Configuration for Datasets feature
 */

// Base limits
const MAX_ROWS_PER_DATASET = 1000;
const MAX_FILE_SIZE_MB = 5;
const MAX_DATASETS_PER_USER = 10;
const MAX_TOTAL_STORAGE_MB = 10;

export const DATASETS_CONFIG = {
  // Feature flags
  FEATURE_ENABLED: true,
  IS_ALPHA: true,

  // Limits
  MAX_ROWS_PER_DATASET,
  MAX_FILE_SIZE_MB,
  MAX_DATASETS_PER_USER,
  MAX_TOTAL_STORAGE_MB,

  // Query execution limits
  QUERY_TIMEOUT_MS: 30000,
  MAX_RESULT_ROWS: 10000,

  // Supported file formats for upload
  SUPPORTED_FORMATS: ['json', 'csv'],

  // Available data sources
  DATA_SOURCES: [
    { value: 'upload', label: 'File Upload', description: 'Upload CSV or JSON files' },
    { value: 'scraper', label: 'Web Scraper', description: 'Import from scraped data' },
    { value: 'api', label: 'API Import', description: 'Import from external APIs' },
    { value: 'sql', label: 'SQL Query', description: 'Create from SQL query results' },
    { value: 'python', label: 'Python Script', description: 'Generate from Python code' }
  ],

  // Quick templates
  QUICK_TEMPLATES: [
    {
      id: 'guatemala_mayors_2024',
      name: 'Guatemala Mayors 2024-2028',
      description: 'Complete list of 340 mayors with party affiliation',
      category: 'government',
      visibility: 'public',
      source: 'scraper',
      dataUrl: '/data/mayors_scraped.json',
      schema: [
        { name: 'Departamento', type: 'text', nullable: false },
        { name: 'Municipio', type: 'text', nullable: false },
        { name: 'Alcalde', type: 'text', nullable: false },
        { name: 'Partido', type: 'text', nullable: false }
      ]
    }
  ],

  // Schema type mapping
  SCHEMA_TYPES: [
    { value: 'text', label: 'Text', description: 'String values' },
    { value: 'number', label: 'Number', description: 'Numeric values' },
    { value: 'date', label: 'Date', description: 'Date/time values' },
    { value: 'boolean', label: 'Boolean', description: 'True/false values' },
    { value: 'json', label: 'JSON', description: 'Complex objects' }
  ],

  // Error messages
  ERROR_MESSAGES: {
    ROW_LIMIT_EXCEEDED: `Dataset exceeds maximum allowed rows (${MAX_ROWS_PER_DATASET})`,
    FILE_SIZE_EXCEEDED: `File size exceeds maximum allowed size (${MAX_FILE_SIZE_MB}MB)`,
    STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded',
    DATASET_LIMIT_EXCEEDED: `Maximum datasets limit reached (${MAX_DATASETS_PER_USER})`,
    INVALID_FORMAT: 'Invalid file format. Supported formats: CSV, JSON',
    QUERY_TIMEOUT: 'Query execution timed out',
    UNAUTHORIZED_ACCESS: 'You do not have permission to access this dataset'
  }
} as const;

export const DATASET_CATEGORIES = [
  'government',
  'economics',
  'demographics',
  'sports',
  'news',
  'reference',
  'research',
  'other'
] as const;

export const QUERY_SHORTCUTS = {
  SQL: [
    {
      name: 'Preview Data',
      template: 'SELECT * FROM {dataset_name} LIMIT 10',
      description: 'Show first 10 rows'
    },
    {
      name: 'Row Count',
      template: 'SELECT COUNT(*) as total_rows FROM {dataset_name}',
      description: 'Count total rows'
    },
    {
      name: 'Unique Values',
      template: 'SELECT DISTINCT {column_name} FROM {dataset_name}',
      description: 'Get unique values in a column'
    },
    {
      name: 'Group & Count',
      template: 'SELECT {column_name}, COUNT(*) as count FROM {dataset_name} GROUP BY {column_name} ORDER BY count DESC',
      description: 'Group by column and count occurrences'
    }
  ],
  PYTHON: [
    {
      name: 'Data Info',
      template: 'import pandas as pd\ndf = pd.DataFrame(data)\nprint(df.info())\nprint(df.describe())',
      description: 'Show dataset information and statistics'
    },
    {
      name: 'Export CSV',
      template: 'import pandas as pd\ndf = pd.DataFrame(data)\ndf.to_csv("export.csv", index=False)\nprint(f"Exported {len(df)} rows")',
      description: 'Export data to CSV format'
    },
    {
      name: 'Filter Data',
      template: 'filtered_data = [row for row in data if row.get("{column_name}") is not None]\nprint(f"Filtered to {len(filtered_data)} rows")',
      description: 'Filter out null values'
    }
  ]
} as const;