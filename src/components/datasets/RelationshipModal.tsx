import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Slider,
  Alert
} from '@mui/material';
import type {
  AdvancedColumnConfig,
  ColumnRelationship,
  RelationshipMatchingStrategy
} from '../../types/datasetEditor';
import { datasetsService } from '../../services/datasets';

interface RelationshipModalProps {
  open: boolean;
  onClose: () => void;
  sourceColumn: AdvancedColumnConfig | null;
  availableColumns: AdvancedColumnConfig[];
  datasetId: string;
  onSave: (columnId: string, relationship: ColumnRelationship) => void;
}

const RelationshipModal: React.FC<RelationshipModalProps> = ({
  open,
  onClose,
  sourceColumn,
  availableColumns,
  datasetId,
  onSave
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [targetDatasetId, setTargetDatasetId] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [matchingStrategy, setMatchingStrategy] = useState<RelationshipMatchingStrategy>('name_normalized');
  const [fuzzyThreshold, setFuzzyThreshold] = useState<number>(0.85);

  const [availableDatasets, setAvailableDatasets] = useState<any[]>([]);
  const [targetColumns, setTargetColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing relationship if editing
  useEffect(() => {
    if (sourceColumn?.relationship) {
      setSelectedColumn(sourceColumn.id);
      setTargetDatasetId(sourceColumn.relationship.targetDatasetId);
      setTargetColumn(sourceColumn.relationship.targetColumnName);
      setMatchingStrategy(sourceColumn.relationship.matchingStrategy);
      setFuzzyThreshold(sourceColumn.relationship.fuzzyThreshold || 0.85);
    } else {
      // Reset for new relationship
      setSelectedColumn('');
      setTargetDatasetId('');
      setTargetColumn('');
      setMatchingStrategy('name_normalized');
      setFuzzyThreshold(0.85);
    }
  }, [sourceColumn]);

  // Load available datasets
  useEffect(() => {
    if (open) {
      loadDatasets();
    }
  }, [open]);

  // Load target columns when dataset selected
  useEffect(() => {
    if (targetDatasetId) {
      loadTargetColumns(targetDatasetId);
    }
  }, [targetDatasetId]);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const datasets = await datasetsService.listDatasets();
      // Filter out current dataset
      const filtered = datasets.filter((ds: any) => ds.id !== datasetId);
      setAvailableDatasets(filtered);
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTargetColumns = async (targetId: string) => {
    try {
      const dataset = await datasetsService.getDataset(targetId);
      if (dataset.schema_definition) {
        const columns = dataset.schema_definition.map((col: any) => col.name);
        setTargetColumns(columns);
      }
    } catch (error) {
      console.error('Error loading target columns:', error);
    }
  };

  const handleSave = () => {
    if (!selectedColumn || !targetDatasetId || !targetColumn) {
      return;
    }

    const relationship: ColumnRelationship = {
      enabled: true,
      targetDatasetId,
      targetColumnName: targetColumn,
      matchingStrategy,
      fuzzyThreshold: matchingStrategy === 'fuzzy' ? fuzzyThreshold : undefined,
      createdAt: new Date().toISOString(),
      updatedBy: 'current_user' // TODO: Get from auth context
    };

    onSave(selectedColumn, relationship);
  };

  const getStrategyDescription = (strategy: RelationshipMatchingStrategy): string => {
    switch (strategy) {
      case 'id':
        return 'Coincidencia exacta de IDs numéricos. Más rápido y preciso.';
      case 'name_exact':
        return 'Coincidencia exacta de texto. Sensible a mayúsculas y acentos.';
      case 'name_normalized':
        return 'Ignora mayúsculas, acentos y espacios. Recomendado para nombres.';
      case 'fuzzy':
        return 'Encuentra coincidencias similares aunque no sean exactas. Útil para variaciones de nombres.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {sourceColumn?.relationship ? 'Editar Relación' : 'Nueva Relación'}
      </DialogTitle>

      <DialogContent>
        {/* Step 1: Select Source Column */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Columna de origen</InputLabel>
          <Select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            disabled={!!sourceColumn}
          >
            {availableColumns.map(col => (
              <MenuItem key={col.id} value={col.id}>
                {col.title} ({col.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Step 2: Select Target Dataset */}
        <FormControl fullWidth sx={{ mt: 3 }}>
          <InputLabel>Dataset relacionado</InputLabel>
          <Select
            value={targetDatasetId}
            onChange={(e) => setTargetDatasetId(e.target.value)}
          >
            {availableDatasets.map((ds: any) => (
              <MenuItem key={ds.id} value={ds.id}>
                {ds.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Step 3: Select Target Column */}
        {targetDatasetId && (
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Columna destino</InputLabel>
            <Select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
            >
              {targetColumns.map(col => (
                <MenuItem key={col} value={col}>
                  {col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Step 4: Matching Strategy */}
        <FormControl fullWidth sx={{ mt: 3 }}>
          <InputLabel>Estrategia de coincidencia</InputLabel>
          <Select
            value={matchingStrategy}
            onChange={(e) => setMatchingStrategy(e.target.value as RelationshipMatchingStrategy)}
          >
            <MenuItem value="id">ID numérico</MenuItem>
            <MenuItem value="name_exact">Nombre exacto</MenuItem>
            <MenuItem value="name_normalized">Nombre normalizado (recomendado)</MenuItem>
            <MenuItem value="fuzzy">Coincidencia difusa</MenuItem>
          </Select>
        </FormControl>

        {/* Strategy Description */}
        <Alert severity="info" sx={{ mt: 2 }}>
          {getStrategyDescription(matchingStrategy)}
        </Alert>

        {/* Fuzzy Threshold (only for fuzzy matching) */}
        {matchingStrategy === 'fuzzy' && (
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>
              Umbral de similitud: {(fuzzyThreshold * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={fuzzyThreshold}
              onChange={(_, value) => setFuzzyThreshold(value as number)}
              min={0.5}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 0.7, label: '70%' },
                { value: 0.85, label: '85%' },
                { value: 1.0, label: '100%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Typography variant="caption" color="text.secondary">
              Mayor valor = coincidencias más estrictas. 85% es un buen balance.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!selectedColumn || !targetDatasetId || !targetColumn}
        >
          {sourceColumn?.relationship ? 'Guardar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationshipModal;
