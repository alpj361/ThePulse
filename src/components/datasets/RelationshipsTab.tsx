import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiLink } from 'react-icons/fi';
import type { AdvancedColumnConfig, ColumnRelationship } from '../../types/datasetEditor';
import RelationshipModal from './RelationshipModal';

interface RelationshipsTabProps {
  columns: AdvancedColumnConfig[];
  datasetId: string;
  onUpdateColumn: (columnId: string, updates: Partial<AdvancedColumnConfig>) => void;
  isOwner: boolean;
  isAdmin: boolean;
  datasetVisibility: 'public' | 'private';
}

const RelationshipsTab: React.FC<RelationshipsTabProps> = ({
  columns,
  datasetId,
  onUpdateColumn,
  isOwner,
  isAdmin,
  datasetVisibility
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<AdvancedColumnConfig | null>(null);

  // Check permissions
  const canEdit = isOwner || (isAdmin && datasetVisibility === 'public');

  // Get columns with relationships
  const columnsWithRelationships = columns.filter(col => col.relationship?.enabled);

  // Get available columns for relationships (text, actor, entity, company types)
  const availableColumns = columns.filter(col =>
    ['text', 'actor', 'entity', 'company'].includes(col.type)
  );

  const handleAddRelationship = () => {
    setEditingColumn(null);
    setModalOpen(true);
  };

  const handleEditRelationship = (column: AdvancedColumnConfig) => {
    setEditingColumn(column);
    setModalOpen(true);
  };

  const handleDeleteRelationship = (column: AdvancedColumnConfig) => {
    if (confirm(`¿Eliminar relación para columna "${column.title}"?`)) {
      onUpdateColumn(column.id, {
        relationship: undefined
      });
    }
  };

  const getStrategyLabel = (strategy: string): string => {
    switch (strategy) {
      case 'id': return 'ID numérico';
      case 'name_exact': return 'Nombre exacto';
      case 'name_normalized': return 'Nombre normalizado';
      case 'fuzzy': return 'Coincidencia difusa';
      default: return strategy;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Relaciones de Dataset
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define relaciones con otros datasets que estarán disponibles en todas las visualizaciones
          </Typography>
        </Box>
        <Button
          startIcon={<FiPlus />}
          onClick={handleAddRelationship}
          disabled={!canEdit || availableColumns.length === 0}
          variant="contained"
        >
          Nueva Relación
        </Button>
      </Box>

      {/* Info Alert */}
      {!canEdit && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {datasetVisibility === 'public'
              ? 'Solo administradores pueden editar relaciones en datasets públicos'
              : 'Solo el propietario puede editar relaciones en este dataset'}
          </Typography>
        </Alert>
      )}

      {/* Relationships List */}
      {columnsWithRelationships.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <FiLink size={48} style={{ color: '#9e9e9e', marginBottom: 16 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No hay relaciones definidas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Las relaciones permiten conectar datos entre diferentes datasets automáticamente
          </Typography>
        </Paper>
      ) : (
        <List>
          {columnsWithRelationships.map(column => {
            const rel = column.relationship!;
            return (
              <Paper key={column.id} sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {column.title}
                        </Typography>
                        <Chip
                          label={column.type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          → Dataset relacionado: <strong>{rel.targetDatasetId.slice(0, 8)}...</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          → Columna destino: <strong>{rel.targetColumnName}</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={getStrategyLabel(rel.matchingStrategy)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {rel.matchingStrategy === 'fuzzy' && rel.fuzzyThreshold && (
                            <Chip
                              label={`Umbral: ${(rel.fuzzyThreshold * 100).toFixed(0)}%`}
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  {canEdit && (
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleEditRelationship(column)}>
                        <FiEdit2 />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRelationship(column)}>
                        <FiTrash2 />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              </Paper>
            );
          })}
        </List>
      )}

      {/* Relationship Modal */}
      <RelationshipModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sourceColumn={editingColumn}
        availableColumns={availableColumns}
        datasetId={datasetId}
        onSave={(columnId, relationship) => {
          onUpdateColumn(columnId, { relationship });
          setModalOpen(false);
        }}
      />
    </Box>
  );
};

export default RelationshipsTab;
