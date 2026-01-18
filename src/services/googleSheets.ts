/**
 * Google Sheets Service
 * Handles reading and parsing Google Sheets data for dataset import
 */

import { loadSheetsApi } from '../utils/googleApiLoader';
import type { AdvancedColumnType } from '../types/datasetEditor';

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    gridProperties: {
      rowCount: number;
      columnCount: number;
    };
  }>;
}

export interface SheetColumn {
  name: string;
  type: AdvancedColumnType;
  values: any[];
}

export interface SheetData {
  spreadsheetId: string;
  sheetName: string;
  columns: SheetColumn[];
  rowCount: number;
}

/**
 * Initialize Google Sheets API client
 * Must be called before any Sheets API operations
 */
export async function initializeSheetsClient(): Promise<void> {
  try {
    await loadSheetsApi();
    console.log('✅ [GoogleSheets] Sheets API initialized');
  } catch (error) {
    console.error('❌ [GoogleSheets] Error initializing Sheets API:', error);
    throw new Error('No se pudo inicializar Google Sheets API');
  }
}

/**
 * Get spreadsheet metadata including all sheets
 */
export async function getSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetMetadata> {
  try {
    console.log(`📊 [GoogleSheets] Getting metadata for: ${spreadsheetId}`);

    // Set access token for the request
    (window as any).gapi.client.setToken({ access_token: accessToken });

    const response = await (window as any).gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });

    const spreadsheet = response.result;

    return {
      spreadsheetId,
      title: spreadsheet.properties.title,
      sheets: spreadsheet.sheets.map((sheet: any) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        gridProperties: {
          rowCount: sheet.properties.gridProperties.rowCount,
          columnCount: sheet.properties.gridProperties.columnCount,
        },
      })),
    };
  } catch (error: any) {
    console.error('❌ [GoogleSheets] Error getting metadata:', error);
    throw new Error(`No se pudo obtener información del Sheet: ${error.result?.error?.message || error.message}`);
  }
}

/**
 * Read data from a specific sheet
 */
export async function readSheetData(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
  range?: string
): Promise<SheetData> {
  try {
    console.log(`📖 [GoogleSheets] Reading data from: ${spreadsheetId}!${sheetName}`);

    // Set access token
    (window as any).gapi.client.setToken({ access_token: accessToken });

    // Construct range (default to entire sheet)
    const fullRange = range || `'${sheetName}'`;

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: fullRange,
      majorDimension: 'ROWS',
    });

    const values = response.result.values;

    if (!values || values.length === 0) {
      throw new Error('La hoja está vacía o no tiene datos');
    }

    // First row is assumed to be headers
    const headers = values[0];
    const dataRows = values.slice(1);

    console.log(`✅ [GoogleSheets] Read ${dataRows.length} rows with ${headers.length} columns`);

    // Convert rows to column-based structure
    const columns: SheetColumn[] = headers.map((header: string, columnIndex: number) => {
      const columnValues = dataRows.map(row => row[columnIndex] ?? null);
      const detectedType = inferColumnType(columnValues);

      return {
        name: header || `Column ${columnIndex + 1}`,
        type: detectedType,
        values: columnValues,
      };
    });

    return {
      spreadsheetId,
      sheetName,
      columns,
      rowCount: dataRows.length,
    };
  } catch (error: any) {
    console.error('❌ [GoogleSheets] Error reading sheet data:', error);
    throw new Error(`No se pudieron leer los datos: ${error.result?.error?.message || error.message}`);
  }
}

/**
 * Read only column headers (first row)
 */
export async function readSheetColumns(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<string[]> {
  try {
    console.log(`📋 [GoogleSheets] Reading columns from: ${spreadsheetId}!${sheetName}`);

    (window as any).gapi.client.setToken({ access_token: accessToken });

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!1:1`, // First row only
      majorDimension: 'ROWS',
    });

    const headers = response.result.values?.[0] || [];
    console.log(`✅ [GoogleSheets] Found ${headers.length} columns`);

    return headers;
  } catch (error: any) {
    console.error('❌ [GoogleSheets] Error reading columns:', error);
    throw new Error(`No se pudieron leer las columnas: ${error.result?.error?.message || error.message}`);
  }
}

/**
 * Infer column type from sample values
 */
export function inferColumnType(values: any[]): AdvancedColumnType {
  // Filter out null/undefined values
  const samples = values.filter(v => v != null && v !== '').slice(0, 100);

  if (samples.length === 0) {
    return 'text'; // Default for empty columns
  }

  // Convert all to strings for pattern matching
  const stringValues = samples.map(v => String(v).trim());

  // Check for URLs
  const urlPattern = /^https?:\/\/.+/i;
  const hasUrls = stringValues.every(v => urlPattern.test(v));

  if (hasUrls) {
    // Check if they're image URLs
    const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
    const areImages = stringValues.every(v => imagePattern.test(v));
    if (areImages) {
      return 'image';
    }
    return 'url';
  }

  // Check for numbers
  const numberPattern = /^-?\d+(\.\d+)?$/;
  const areNumbers = stringValues.every(v => numberPattern.test(v.replace(/,/g, '')));

  if (areNumbers) {
    // Check for money indicators
    const moneyPattern = /^[Q$€£¥]|GTQ|USD|EUR|GBP|JPY/i;
    const hasMoneySymbols = stringValues.some(v => moneyPattern.test(v));

    if (hasMoneySymbols) {
      return 'money';
    }

    return 'number';
  }

  // Check for dates
  const hasDatePattern = stringValues.some(v => {
    const date = new Date(v);
    return !isNaN(date.getTime()) && v.length > 5; // Basic date validation
  });

  if (hasDatePattern) {
    // More than 50% should be valid dates
    const validDates = stringValues.filter(v => {
      const date = new Date(v);
      return !isNaN(date.getTime());
    });

    if (validDates.length / stringValues.length > 0.5) {
      return 'date';
    }
  }

  // Check for checkboxes (TRUE/FALSE or YES/NO)
  const checkboxPattern = /^(true|false|yes|no|1|0|si|sí)$/i;
  const areCheckboxes = stringValues.every(v => checkboxPattern.test(v));

  if (areCheckboxes) {
    return 'checkbox';
  }

  // Default to text
  return 'text';
}

/**
 * Convert sheet data to dataset format
 */
export function convertSheetToDataset(sheetData: SheetData) {
  const { columns, rowCount } = sheetData;

  // Build schema definition
  const schemaDefinition = columns.map((col, index) => ({
    id: `col_${index}`,
    name: col.name,
    type: col.type,
    required: false,
    order: index,
  }));

  // Build JSON data (row-based)
  const jsonData: Record<string, any>[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const row: Record<string, any> = {};

    columns.forEach(col => {
      const value = col.values[rowIndex];
      row[col.name] = value !== null && value !== '' ? value : null;
    });

    jsonData.push(row);
  }

  return {
    schemaDefinition,
    jsonData,
    rowCount,
    columnCount: columns.length,
  };
}

/**
 * Extract spreadsheet ID from Google Sheets URL
 */
export function extractSpreadsheetId(url: string): string | null {
  // Match patterns like:
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID

  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Validate spreadsheet ID format
 */
export function isValidSpreadsheetId(id: string): boolean {
  // Google Sheets IDs are typically 44 characters long
  // and contain alphanumeric characters, dashes, and underscores
  return /^[a-zA-Z0-9-_]{10,100}$/.test(id);
}

/**
 * Read data incrementally from a specific row onwards
 * Used for sync operations to only fetch new rows
 */
export async function readSheetDataIncremental(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
  startRow: number
): Promise<any[][]> {
  try {
    console.log(`📖 [GoogleSheets] Reading incremental data from row ${startRow}`);

    (window as any).gapi.client.setToken({ access_token: accessToken });

    // Read from startRow to end
    const range = `'${sheetName}'!A${startRow}:ZZ`;

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      majorDimension: 'ROWS',
    });

    const values = response.result.values || [];
    console.log(`✅ [GoogleSheets] Read ${values.length} new rows`);

    return values;
  } catch (error: any) {
    console.error('❌ [GoogleSheets] Error reading incremental data:', error);
    throw new Error(`No se pudieron leer los datos incrementales: ${error.result?.error?.message || error.message}`);
  }
}
