import { supabase } from './supabase';
import type {
    BaseMapping,
    Mapping,
    CreateMappingData,
    UpdateMappingData,
    ListMappingsFilters
} from '../types/mappings';

export const mappingsService = {
    /**
     * List mappings with optional filtering
     */
    async listMappings(filters?: ListMappingsFilters): Promise<BaseMapping[]> {
        let query = supabase
            .from('mappings')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.project_id) {
            query = query.eq('project_id', filters.project_id);
        }

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching mappings:', error);
            throw new Error(error.message || 'Failed to fetch mappings');
        }

        // Apply search filter if provided
        if (filters?.search && data) {
            const searchTerm = filters.search.toLowerCase();
            return data.filter(m =>
                m.name.toLowerCase().includes(searchTerm) ||
                (m.description && m.description.toLowerCase().includes(searchTerm))
            );
        }

        return data || [];
    },

    /**
     * Get mapping by ID
     */
    async getMappingById(mappingId: string): Promise<BaseMapping | null> {
        const { data, error } = await supabase
            .from('mappings')
            .select('*')
            .eq('id', mappingId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            console.error('Error fetching mapping:', error);
            throw new Error(error.message || 'Failed to fetch mapping');
        }

        return data;
    },

    /**
     * Create a new mapping
     */
    async createMapping(input: CreateMappingData): Promise<BaseMapping> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            throw new Error('User not authenticated');
        }

        const mappingRecord = {
            project_id: input.project_id,
            user_id: userData.user.id,
            name: input.name,
            description: input.description || '',
            type: input.type,
            config: input.config || {},
            data: input.data || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('mappings')
            .insert(mappingRecord)
            .select()
            .single();

        if (error) {
            console.error('Error creating mapping:', error);
            throw new Error(error.message || 'Failed to create mapping');
        }

        return data;
    },

    /**
     * Update an existing mapping
     */
    async updateMapping(
        mappingId: string,
        updates: UpdateMappingData
    ): Promise<BaseMapping> {
        const dbUpdates = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('mappings')
            .update(dbUpdates)
            .eq('id', mappingId)
            .select()
            .single();

        if (error) {
            console.error('Error updating mapping:', error);
            throw new Error(error.message || 'Failed to update mapping');
        }

        return data;
    },

    /**
     * Delete a mapping
     */
    async deleteMapping(mappingId: string): Promise<void> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            throw new Error('User not authenticated');
        }

        // Check if user owns the mapping
        const mapping = await this.getMappingById(mappingId);
        if (!mapping) {
            throw new Error('Mapping not found');
        }

        if (mapping.user_id !== userData.user.id) {
            throw new Error('You can only delete your own mappings');
        }

        const { error } = await supabase
            .from('mappings')
            .delete()
            .eq('id', mappingId);

        if (error) {
            console.error('Error deleting mapping:', error);
            throw new Error(error.message || 'Failed to delete mapping');
        }
    }
};
