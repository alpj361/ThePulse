import { EXTRACTORW_API_URL } from './api';

export async function extractCapturados(
  codexItemId: string,
  projectId: string,
  accessToken: string
): Promise<{ success: boolean; count: number; cards: any[] }> {
  const response = await fetch(`${EXTRACTORW_API_URL}/capturados/from-codex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ codex_item_id: codexItemId, project_id: projectId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  return response.json();
}

export async function bulkExtractCapturados(
  projectId: string,
  accessToken: string,
  codexItemIds?: string[]
): Promise<{ processed_count: number; total_cards: number }> {
  const res = await fetch(`${EXTRACTORW_API_URL}/capturados/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ 
      project_id: projectId,
      codex_item_ids: codexItemIds 
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCapturadoCard(
  cardId: string,
  accessToken: string
): Promise<{ success: boolean; message: string; deleted_id: string }> {
  const response = await fetch(`${EXTRACTORW_API_URL}/capturados/${cardId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  return response.json();
}

export async function deleteAllCapturadoCards(projectId: string, accessToken: string) {
  const res = await fetch(`${EXTRACTORW_API_URL}/capturados/project/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CapturadoUpdatePayload {
  entity?: string;
  city?: string;
  department?: string;
  description?: string;
  discovery?: string;
}

export async function updateCapturadoCard(
  cardId: string,
  updates: CapturadoUpdatePayload,
  accessToken: string
): Promise<{ success: boolean; card: any }> {
  const response = await fetch(`${EXTRACTORW_API_URL}/capturados/${cardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  return response.json();
} 

export interface CapturadoCreatePayload {
  entity?: string;
  city?: string;
  department?: string;
  description?: string;
  discovery?: string;
  amount?: number;
  currency?: string;
  source?: string;
  start_date?: string; // ISO date
  duration_days?: number;
  counter?: number; // contador de ocurrencias
  percentage?: number; // porcentaje (0-100)
  quantity?: number; // cantidad no monetaria
  // Duración avanzada
  duration_text?: string;
  duration_years?: number;
  duration_months?: number;
  duration_hours?: number;
  duration_minutes?: number;
  // Tiempo/periodo avanzado
  time_type?: 'day' | 'year_range' | 'decade' | 'custom';
  time_date?: string;
  time_start_year?: number;
  time_end_year?: number;
  time_decade_start_year?: number;
  time_lower_date?: string;
  time_upper_date?: string;
  time_bounds?: '[]' | '[)' | '()' | '(]';
}

export async function createCapturadoCard(
  projectId: string,
  payload: CapturadoCreatePayload,
  accessToken: string
): Promise<{ success: boolean; card: any }> {
  const res = await fetch(`${EXTRACTORW_API_URL}/capturados`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ project_id: projectId, ...payload })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}