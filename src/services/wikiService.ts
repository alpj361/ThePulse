// Wiki Service - API calls for Wiki functionality
import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Types
export interface WikiItem {
  id: string;
  user_id: string;
  category: 'wiki';
  subcategory: 'person' | 'organization' | 'location' | 'event' | 'concept';
  name: string;
  description?: string;
  relevance_score: number;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface WikiItemCreate {
  user_id: string;
  subcategory: 'person' | 'organization' | 'location' | 'event' | 'concept';
  name: string;
  description?: string;
  relevance_score: number;
  metadata: Record<string, any>;
  tags?: string[];
}

export interface WikiStats {
  total: number;
  by_type: {
    person: number;
    organization: number;
    location: number;
    event: number;
    concept: number;
  };
  avg_relevance: number;
}

// Get all Wiki items for a user
export async function getWikiItems(
  userId: string,
  subcategory?: string,
  minRelevance?: number
): Promise<WikiItem[]> {
  try {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    if (subcategory) params.append('subcategory', subcategory);
    if (minRelevance) params.append('min_relevance', minRelevance.toString());

    const response = await fetch(`${BACKEND_URL}/api/wiki/items?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki items: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching wiki items:', error);
    return [];
  }
}

// Create a new Wiki item
export async function createWikiItem(item: WikiItemCreate): Promise<WikiItem | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wiki/save-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Failed to create wiki item: ${response.statusText}`);
    }

    const data = await response.json();
    return data.item || null;
  } catch (error) {
    console.error('Error creating wiki item:', error);
    return null;
  }
}

// Get a single Wiki item
export async function getWikiItem(itemId: string): Promise<WikiItem | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki item: ${response.statusText}`);
    }

    const data = await response.json();
    return data.item || null;
  } catch (error) {
    console.error('Error fetching wiki item:', error);
    return null;
  }
}

// Update a Wiki item
export async function updateWikiItem(
  itemId: string,
  updates: Partial<WikiItemCreate>
): Promise<WikiItem | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update wiki item: ${response.statusText}`);
    }

    const data = await response.json();
    return data.item || null;
  } catch (error) {
    console.error('Error updating wiki item:', error);
    return null;
  }
}

// Delete a Wiki item
export async function deleteWikiItem(itemId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete wiki item: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting wiki item:', error);
    return false;
  }
}

// Update relevance score
export async function updateRelevanceScore(
  itemId: string,
  score: number
): Promise<WikiItem | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}/relevance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ relevance_score: score }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update relevance: ${response.statusText}`);
    }

    const data = await response.json();
    return data.item || null;
  } catch (error) {
    console.error('Error updating relevance:', error);
    return null;
  }
}

// Get Wiki statistics
export async function getWikiStats(userId: string): Promise<WikiStats | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/wiki/stats?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.stats || null;
  } catch (error) {
    console.error('Error fetching wiki stats:', error);
    return null;
  }
}

// Search Wiki items
export async function searchWikiItems(
  userId: string,
  query: string,
  subcategory?: string
): Promise<WikiItem[]> {
  try {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('query', query);
    if (subcategory) params.append('subcategory', subcategory);

    const response = await fetch(`${BACKEND_URL}/api/wiki/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search wiki items: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error searching wiki items:', error);
    return [];
  }
}
