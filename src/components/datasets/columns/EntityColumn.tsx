import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { FiUser, FiHome, FiPlus } from 'react-icons/fi';
import { ActorValue, EntityValue, CompanyValue } from '../../../types/datasetEditor';
import { supabase } from '../../../services/supabase';

type EntityType = 'actor' | 'entity' | 'company';

interface BaseEntityOption {
  id?: string;
  name: string;
  type?: string;
  description?: string;
}

interface EntityColumnProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  entityType: EntityType;
  allowCreateNew?: boolean;
  disabled?: boolean;
  focus?: boolean;
}

// Generic Entity Column Editor
function EntityColumnEditor<T extends BaseEntityOption>({
  value,
  onChange,
  entityType,
  allowCreateNew = true,
  disabled = false,
  focus = false
}: EntityColumnProps<T>) {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEntityForm, setNewEntityForm] = useState<Partial<T>>({});

  // Load existing entities from database
  const loadEntities = async (searchTerm: string = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      let tableName = '';
      let selectFields = 'id, name';

      switch (entityType) {
        case 'actor':
          tableName = 'actors';
          selectFields = 'id, name, type, entity_id';
          break;
        case 'entity':
          tableName = 'entities';
          selectFields = 'id, name, type, description';
          break;
        case 'company':
          tableName = 'companies';
          selectFields = 'id, name, industry, size';
          break;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select(selectFields)
        .ilike('name', `%${searchTerm}%`)
        .limit(20);

      if (error) {
        console.error(`Error loading ${entityType}s:`, error);
        setOptions([]);
        return;
      }

      setOptions((data as T[]) || []);
    } catch (error) {
      console.error(`Error loading ${entityType}s:`, error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities(inputValue);
  }, [inputValue, entityType]);

  const handleEntitySelect = (entity: T | null) => {
    onChange(entity);
  };

  const handleCreateNew = () => {
    setNewEntityForm({ name: inputValue } as Partial<T>);
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      let tableName = '';
      let insertData: any = { ...newEntityForm };

      switch (entityType) {
        case 'actor':
          tableName = 'actors';
          insertData = {
            name: newEntityForm.name,
            type: (newEntityForm as any).type || 'person'
          };
          break;
        case 'entity':
          tableName = 'entities';
          insertData = {
            name: newEntityForm.name,
            type: (newEntityForm as any).type || 'institution',
            description: (newEntityForm as any).description
          };
          break;
        case 'company':
          tableName = 'companies';
          insertData = {
            name: newEntityForm.name,
            industry: (newEntityForm as any).industry,
            size: (newEntityForm as any).size || 'medium'
          };
          break;
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      onChange(data as T);
      setCreateDialogOpen(false);
      setNewEntityForm({});

      // Reload options to include the new entity
      loadEntities(inputValue);
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
    }
  };

  const getIcon = () => {
    switch (entityType) {
      case 'actor': return <FiUser />;
      case 'company': return <FiHome />;
      default: return <FiHome />;
    }
  };

  return (
    <>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => handleEntitySelect(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        options={options}
        loading={loading}
        disabled={disabled}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={
          allowCreateNew && inputValue ? (
            <Button
              startIcon={<FiPlus />}
              onClick={handleCreateNew}
              size="small"
              fullWidth
            >
              Crear "{inputValue}"
            </Button>
          ) : (
            `No se encontraron ${entityType}s`
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            placeholder={`Buscar ${entityType}...`}
            autoFocus={focus}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <span style={{ color: '#666', marginRight: 8 }}>
                    {getIcon()}
                  </span>
                  {params.InputProps.startAdornment}
                </>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' }
              }
            }}
          />
        )}
        renderOption={(props, option) => (
          <Paper component="li" {...props} sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getIcon()}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {option.name}
                </Typography>
                {option.type && (
                  <Typography variant="caption" color="text.secondary">
                    {option.type}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      />

      {/* Create New Entity Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nuevo {entityType}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={newEntityForm.name || ''}
            onChange={(e) => setNewEntityForm({ ...newEntityForm, name: e.target.value })}
            sx={{ mt: 2 }}
          />

          {entityType === 'actor' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={(newEntityForm as any).type || 'person'}
                onChange={(e) => setNewEntityForm({ ...newEntityForm, type: e.target.value })}
              >
                <MenuItem value="person">Persona</MenuItem>
                <MenuItem value="organization">Organización</MenuItem>
              </Select>
            </FormControl>
          )}

          {entityType === 'entity' && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={(newEntityForm as any).type || 'institution'}
                  onChange={(e) => setNewEntityForm({ ...newEntityForm, type: e.target.value })}
                >
                  <MenuItem value="government">Gobierno</MenuItem>
                  <MenuItem value="ngo">ONG</MenuItem>
                  <MenuItem value="institution">Institución</MenuItem>
                  <MenuItem value="political_party">Partido Político</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={2}
                value={(newEntityForm as any).description || ''}
                onChange={(e) => setNewEntityForm({ ...newEntityForm, description: e.target.value })}
                sx={{ mt: 2 }}
              />
            </>
          )}

          {entityType === 'company' && (
            <>
              <TextField
                fullWidth
                label="Industria"
                value={(newEntityForm as any).industry || ''}
                onChange={(e) => setNewEntityForm({ ...newEntityForm, industry: e.target.value })}
                sx={{ mt: 2 }}
              />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Tamaño</InputLabel>
                <Select
                  value={(newEntityForm as any).size || 'medium'}
                  onChange={(e) => setNewEntityForm({ ...newEntityForm, size: e.target.value })}
                >
                  <MenuItem value="small">Pequeña</MenuItem>
                  <MenuItem value="medium">Mediana</MenuItem>
                  <MenuItem value="large">Grande</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateSubmit} variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Entity Display Component
function EntityColumnDisplay<T extends BaseEntityOption>({
  value,
  entityType
}: {
  value: T | string | null;
  entityType: EntityType;
}) {
  if (!value) {
    return <span style={{ color: '#999' }}>-</span>;
  }

  const getIcon = () => {
    switch (entityType) {
      case 'actor': return <FiUser size={14} />;
      case 'company': return <FiHome size={14} />;
      default: return <FiHome size={14} />;
    }
  };

  const displayValue = typeof value === 'string'
    ? { name: value, type: '' }
    : value;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <span style={{ color: '#666', flexShrink: 0 }}>
        {getIcon()}
      </span>
      <Typography variant="body2" noWrap>
        {displayValue.name}
      </Typography>
    </Box>
  );
}

// Column Creators
export const createActorColumn = (allowCreateNew: boolean = true) => {
  return {
    component: ({ rowData, setRowData, focus, disabled }: any) => {
      if (focus) {
        return (
          <EntityColumnEditor<ActorValue>
            value={rowData || null}
            onChange={(newValue) => setRowData(newValue)}
            entityType="actor"
            allowCreateNew={allowCreateNew}
            focus={focus}
            disabled={disabled}
          />
        );
      }
      return <EntityColumnDisplay value={rowData} entityType="actor" />;
    },
    deleteValue: () => null,
    copyValue: ({ rowData }: any) => {
      if (!rowData) return '';
      return typeof rowData === 'string' ? rowData : rowData.name || '';
    },
    pasteValue: ({ value }: any) => {
      if (typeof value !== 'string') return null;
      return { name: value, type: 'person' };
    },
    minWidth: 180
  };
};

export const createEntityColumn = (allowCreateNew: boolean = true) => {
  return {
    component: ({ rowData, setRowData, focus, disabled }: any) => {
      if (focus) {
        return (
          <EntityColumnEditor<EntityValue>
            value={rowData || null}
            onChange={(newValue) => setRowData(newValue)}
            entityType="entity"
            allowCreateNew={allowCreateNew}
            focus={focus}
            disabled={disabled}
          />
        );
      }
      return <EntityColumnDisplay value={rowData} entityType="entity" />;
    },
    deleteValue: () => null,
    copyValue: ({ rowData }: any) => {
      if (!rowData) return '';
      return typeof rowData === 'string' ? rowData : rowData.name || '';
    },
    pasteValue: ({ value }: any) => {
      if (typeof value !== 'string') return null;
      return { name: value, type: 'institution' };
    },
    minWidth: 180
  };
};

export const createCompanyColumn = (allowCreateNew: boolean = true) => {
  return {
    component: ({ rowData, setRowData, focus, disabled }: any) => {
      if (focus) {
        return (
          <EntityColumnEditor<CompanyValue>
            value={rowData || null}
            onChange={(newValue) => setRowData(newValue)}
            entityType="company"
            allowCreateNew={allowCreateNew}
            focus={focus}
            disabled={disabled}
          />
        );
      }
      return <EntityColumnDisplay value={rowData} entityType="company" />;
    },
    deleteValue: () => null,
    copyValue: ({ rowData }: any) => {
      if (!rowData) return '';
      return typeof rowData === 'string' ? rowData : rowData.name || '';
    },
    pasteValue: ({ value }: any) => {
      if (typeof value !== 'string') return null;
      return { name: value, size: 'medium' };
    },
    minWidth: 180
  };
};