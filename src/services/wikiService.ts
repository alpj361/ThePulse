// Wiki Service - Supabase-based Wiki functionality
import { supabase } from './supabase';

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
    let query = supabase
      .from('wiki_items')
      .select('*')
      .eq('user_id', userId);

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    if (minRelevance !== undefined) {
      query = query.gte('relevance_score', minRelevance);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching wiki items:', error);
    return [];
  }
}

// Create a new Wiki item
export async function createWikiItem(item: WikiItemCreate): Promise<WikiItem | null> {
  try {
    const { data, error } = await supabase
      .from('wiki_items')
      .insert({
        ...item,
        category: 'wiki',
        tags: item.tags || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating wiki item:', error);
    return null;
  }
}

// Upsert multiple Wiki items (insert or update on conflict)
export async function upsertWikiItems(items: WikiItemCreate[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wiki_items')
      .upsert(
        items.map(item => ({
          ...item,
          category: 'wiki',
          tags: item.tags || [],
        })),
        { onConflict: 'user_id,name', ignoreDuplicates: false }
        // Note: Requires a unique constraint on (user_id, name) in the DB. 
        // If not present, we might need to handle per-item logic or trust the ID if provided (but here we don't have IDs for new items).
        // For now, we'll try standard upsert. If it fails, we fall back to manual checks in the caller.
      );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error upserting wiki items:', error);
    return false;
  }
}

// Get a single Wiki item
export async function getWikiItem(itemId: string): Promise<WikiItem | null> {
  try {
    const { data, error } = await supabase
      .from('wiki_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      throw error;
    }

    return data;
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
    const { data, error } = await supabase
      .from('wiki_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating wiki item:', error);
    return null;
  }
}

// Delete a Wiki item
export async function deleteWikiItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wiki_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting wiki item:', error);
    return false;
  }
}

// Delete multiple Wiki items
export async function deleteWikiItems(itemIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wiki_items')
      .delete()
      .in('id', itemIds);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting wiki items:', error);
    return false;
  }
}

// Update relevance score
export async function updateRelevanceScore(
  itemId: string,
  score: number
): Promise<WikiItem | null> {
  try {
    const { data, error } = await supabase
      .from('wiki_items')
      .update({ relevance_score: score })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating relevance:', error);
    return null;
  }
}

// Get Wiki statistics
export async function getWikiStats(userId: string): Promise<WikiStats | null> {
  try {
    const { data, error } = await supabase
      .from('wiki_items')
      .select('subcategory, relevance_score')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const stats: WikiStats = {
      total: data.length,
      by_type: {
        person: data.filter(item => item.subcategory === 'person').length,
        organization: data.filter(item => item.subcategory === 'organization').length,
        location: data.filter(item => item.subcategory === 'location').length,
        event: data.filter(item => item.subcategory === 'event').length,
        concept: data.filter(item => item.subcategory === 'concept').length,
      },
      avg_relevance: data.length > 0
        ? data.reduce((sum, item) => sum + item.relevance_score, 0) / data.length
        : 0,
    };

    return stats;
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
    let supabaseQuery = supabase
      .from('wiki_items')
      .select('*')
      .eq('user_id', userId);

    if (subcategory) {
      supabaseQuery = supabaseQuery.eq('subcategory', subcategory);
    }

    // Search in name and description fields
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    const { data, error } = await supabaseQuery.order('relevance_score', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error searching wiki items:', error);
    return [];
  }
}
