import { supabase } from './supabase';
import { DATASETS_CONFIG } from '../config/datasets';
import { invalidateCache } from './geographicDataIndex';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  owner_id: string;
  project_id?: string;
  json_data: any[];
  schema_definition: Array<{ name: string, type: string, nullable: boolean }>;
  row_count: number;
  size_bytes: number;
  tags: string[];
  source: 'upload' | 'scraper' | 'sql' | 'python' | 'api';
  created_at: string;
  updated_at: string;
  last_queried_at?: string;
}

export interface DatasetShortcut {
  id: string;
  name: string;
  description?: string;
  category: string;
  shortcut_type: 'sql' | 'python';
  shortcut_code: string;
  parameters: any[];
  is_system: boolean;
  owner_id?: string;
}

export interface QueryResult {
  success: boolean;
  data: any[];
  metadata: {
    dataset_name: string;
    rows_returned: number;
    execution_time_ms: number;
    query_type: string;
    total_rows_in_dataset: number;
  };
}

export interface CreateDatasetInput {
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  project_id?: string;
  source: 'upload' | 'scraper' | 'sql' | 'python' | 'api';
  data: any[];
  schema: Array<{ name: string, type: string, nullable: boolean }>;
  tags?: string[];
}

export const datasetsService = {
  /**
   * List datasets with optional filtering
   */
  async listDatasets(filter?: {
    visibility?: 'public' | 'private' | 'all';
    project_id?: string;
    search?: string;
  }): Promise<Dataset[]> {
    const datasets: Dataset[] = [];

    // Get private datasets if requested
    if (!filter?.visibility || filter.visibility === 'private' || filter.visibility === 'all') {
      let privateQuery = supabase.from('private_datasets').select('*');

      if (filter?.project_id) {
        privateQuery = privateQuery.eq('project_id', filter.project_id);
      }

      const { data: privateData, error: privateError } = await privateQuery
        .order('created_at', { ascending: false });

      if (privateError) {
        console.error('Error fetching private datasets:', privateError);
      } else if (privateData) {
        datasets.push(...privateData.map(d => ({ ...d, visibility: 'private' as const })));
      }
    }

    // Get public datasets if requested
    if (!filter?.visibility || filter.visibility === 'public' || filter.visibility === 'all') {
      let publicQuery = supabase.from('public_datasets').select('*');

      const { data: publicData, error: publicError } = await publicQuery
        .order('created_at', { ascending: false });

      if (publicError) {
        console.error('Error fetching public datasets:', publicError);
      } else if (publicData) {
        datasets.push(...publicData.map(d => ({ ...d, visibility: 'public' as const })));
      }
    }

    // Apply search filter if provided
    if (filter?.search) {
      const searchTerm = filter.search.toLowerCase();
      return datasets.filter(d =>
        d.name.toLowerCase().includes(searchTerm) ||
        (d.description && d.description.toLowerCase().includes(searchTerm)) ||
        d.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return datasets;
  },

  /**
   * Create a new dataset
   */
  async createDataset(input: CreateDatasetInput): Promise<Dataset> {
    console.log('Creating dataset with input:', input);

    // Try Edge Function first, fallback to direct database insert
    try {
      const { data, error } = await supabase.functions.invoke('datasets-create', {
        body: input,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Edge Function response:', { data, error });

      if (!error && data && data.success) {
        return data.dataset;
      }

      console.warn('Edge Function failed, falling back to direct database insert');
    } catch (edgeFunctionError) {
      console.warn('Edge Function error, falling back to direct database insert:', edgeFunctionError);
    }

    // Fallback: Direct database insert
    return this.createDatasetDirect(input);
  },

  /**
   * Create dataset directly in database (fallback method)
   */
  async createDatasetDirect(input: CreateDatasetInput): Promise<Dataset> {
    try {
      console.log('Creating dataset directly in database');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      // Calculate dataset size
      const dataSize = JSON.stringify(input.data).length;

      // Prepare dataset record with conditional fields based on visibility
      const baseRecord = {
        name: input.name,
        description: input.description || '',
        owner_id: userData.user.id,
        json_data: input.data,
        schema_definition: input.schema,
        row_count: input.data.length,
        size_bytes: dataSize,
        tags: input.tags || [],
        source: input.source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add project_id only for private datasets
      const datasetRecord = input.visibility === 'private' && input.project_id
        ? { ...baseRecord, project_id: input.project_id }
        : baseRecord;

      console.log('Inserting dataset record:', datasetRecord);

      // Insert into appropriate table based on visibility
      const tableName = input.visibility === 'private' ? 'private_datasets' : 'public_datasets';

      const { data, error } = await supabase
        .from(tableName)
        .insert(datasetRecord)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(error.message || 'Failed to create dataset');
      }

      console.log('Dataset created successfully:', data);

      return {
        ...data,
        visibility: input.visibility
      };

    } catch (error) {
      console.error('Direct dataset creation error:', error);
      throw error;
    }
  },

  /**
   * Execute SQL or Python query on dataset
   */
  async executeQuery(
    datasetId: string,
    query: string,
    type: 'sql' | 'python',
    parameters: any[] = [],
    limit: number = 1000
  ): Promise<QueryResult> {
    const { data, error } = await supabase.functions.invoke('datasets-query', {
      body: {
        dataset_id: datasetId,
        query_type: type,
        query,
        parameters,
        limit
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to execute query');
    }

    if (!data.success) {
      throw new Error(data.error || 'Query execution failed');
    }

    return data;
  },

  /**
   * Get dataset by ID
   */
  async getDataset(datasetId: string): Promise<Dataset | null> {
    // Try private datasets first
    const { data: privateDataset } = await supabase
      .from('private_datasets')
      .select('*')
      .eq('id', datasetId)
      .single();

    if (privateDataset) {
      return { ...privateDataset, visibility: 'private' };
    }

    // Try public datasets
    const { data: publicDataset } = await supabase
      .from('public_datasets')
      .select('*')
      .eq('id', datasetId)
      .single();

    if (publicDataset) {
      return { ...publicDataset, visibility: 'public' };
    }

    return null;
  },

  /**
   * Preview dataset data (first N rows)
   */
  async previewData(datasetId: string, limit: number = 100): Promise<any[]> {
    const dataset = await this.getDataset(datasetId);

    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const preview = Array.isArray(dataset.json_data)
      ? dataset.json_data.slice(0, limit)
      : [];

    return preview;
  },

  /**
   * Get available shortcuts
   */
  async getShortcuts(): Promise<DatasetShortcut[]> {
    const { data, error } = await supabase
      .from('dataset_shortcuts')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  },


  /**
   * Update a dataset (metadata, schema, or data)
   */
  async updateDataset(
    datasetId: string,
    updates: Partial<CreateDatasetInput> & { type_metadata?: Record<string, any> }
  ): Promise<Dataset> {
    // Map API fields to database fields
    const { data, schema, ...otherUpdates } = updates;
    const dbUpdates = {
      ...otherUpdates,
      ...(data && { json_data: data }),
      ...(schema && { schema_definition: schema }),
      updated_at: new Date().toISOString()
    };

    console.log('Updating dataset with:', dbUpdates);

    // Try to update private dataset first
    const { data: privateData, error: privateError } = await supabase
      .from('private_datasets')
      .update(dbUpdates)
      .eq('id', datasetId)
      .select()
      .single();

    if (!privateError && privateData) {
      // Invalidate geographic index cache so map reflects schema changes
      invalidateCache();
      console.log('🗺️ Geographic index cache invalidated after dataset update');
      return { ...privateData, visibility: 'private' };
    }

    console.log('Private update error:', privateError);

    // Try public dataset (will fail if user is not admin due to RLS)
    const { data: publicData, error: publicError } = await supabase
      .from('public_datasets')
      .update(dbUpdates)
      .eq('id', datasetId)
      .select()
      .single();

    console.log('Public update error:', publicError);

    if (publicError) {
      throw new Error(publicError.message || 'Failed to update dataset');
    }

    // Invalidate geographic index cache so map reflects schema changes
    invalidateCache();
    console.log('🗺️ Geographic index cache invalidated after dataset update');

    return { ...publicData, visibility: 'public' };
  },

  /**
   * Delete dataset
   */
  async deleteDataset(datasetId: string): Promise<void> {
    // First determine if it's private or public
    const dataset = await this.getDataset(datasetId);

    if (!dataset) {
      throw new Error('Dataset not found');
    }

    // Check permissions before attempting deletion
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // For private datasets, only owner can delete
    // For public datasets, only admins can delete
    if (dataset.visibility === 'public') {
      const { data: isUserAdmin, error: adminError } = await supabase.rpc('is_admin', {
        check_user_id: userData.user.id
      });

      if (adminError) {
        console.error('Error checking admin status:', adminError);
        throw new Error('Unable to verify permissions');
      }

      if (!isUserAdmin) {
        throw new Error('Only administrators can delete public datasets');
      }
    } else {
      // For private datasets, check if user is the owner
      if (dataset.owner_id !== userData.user.id) {
        throw new Error('You can only delete your own private datasets');
      }
    }

    const tableName = dataset.visibility === 'private' ? 'private_datasets' : 'public_datasets';

    const { error, count } = await supabase
      .from(tableName)
      .delete({ count: 'exact' })
      .eq('id', datasetId);

    if (error) {
      throw new Error(`Failed to delete dataset: ${error.message}`);
    }

    if (count === 0) {
      throw new Error('Dataset could not be deleted. You may not have permission to delete this dataset.');
    }
  },


  /**
   * Get user's storage usage
   */
  async getStorageUsage(): Promise<{
    datasets_count: number;
    total_size_bytes: number;
    quota: {
      max_datasets: number;
      max_size_bytes: number;
    };
  }> {
    const datasets = await this.listDatasets({ visibility: 'all' });

    const total_size_bytes = datasets.reduce((sum, ds) => sum + (ds.size_bytes || 0), 0);
    const datasets_count = datasets.length;

    // Basic quota for now - can be enhanced based on user type
    const quota = {
      max_datasets: 10,
      max_size_bytes: 10 * 1024 * 1024 // 10MB
    };

    return {
      datasets_count,
      total_size_bytes,
      quota
    };
  },

  /**
   * Get dataset data for editing
   */
  async getDatasetData(datasetId: string): Promise<any[]> {
    // First determine if it's private or public
    const dataset = await this.getDataset(datasetId);
    console.log('getDatasetData - Found dataset:', dataset);

    if (!dataset) {
      throw new Error('Dataset not found');
    }

    const data = dataset.json_data || [];
    console.log('getDatasetData - Returning data:', data);
    return data;
  }
};