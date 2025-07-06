import { EXTRACTORW_API_URL } from './api';

export interface AnalyzePendingLinksOptions {
  itemIds?: string[];
  processAll?: boolean;
  dryRun?: boolean;
}

export interface AnalyzePendingLinksResult {
  success: boolean;
  message: string;
  processed: number;
  results: any[];
  [key: string]: any;
}

/**
 * Llama al backend ExtractorW para analizar enlaces pendientes en el Codex.
 * Usa EXTRACTORW_API_URL, así en desarrollo irá a http://localhost:8080/api
 * y en producción al dominio configurado.
 */
export async function analyzePendingLinks(
  opts: AnalyzePendingLinksOptions = { processAll: true },
  authToken?: string
): Promise<AnalyzePendingLinksResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `${EXTRACTORW_API_URL}/pending-analysis/analyze-pending-links`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(opts)
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
} 