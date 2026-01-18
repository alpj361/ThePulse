import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import { FiLink, FiCheck, FiX } from 'react-icons/fi';
import type { ColumnRelationship, ResolvedRelationship } from '../../types/datasetEditor';
import { resolveRelationship } from '../../services/relationshipResolver';
import { datasetsService } from '../../services/datasets';

interface RelationshipViewModalProps {
  open: boolean;
  onClose: () => void;
  sourceDatasetId: string;
  sourceColumn: string;
  sourceColumnTitle: string;
  sourceValue: any;
  relationship: ColumnRelationship;
}

const RelationshipViewModal: React.FC<RelationshipViewModalProps> = ({
  open,
  onClose,
  sourceDatasetId,
  sourceColumn,
  sourceColumnTitle,
  sourceValue,
  relationship
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedRelationship | null>(null);
  const [targetDatasetName, setTargetDatasetName] = useState<string>('');

  useEffect(() => {
    if (open) {
      resolveRelationshipData();
    }
  }, [open, sourceValue, relationship]);

  const resolveRelationshipData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load target dataset info
      const targetDataset = await datasetsService.getDataset(relationship.targetDatasetId);
      setTargetDatasetName(targetDataset.name);

      // Resolve the relationship
      const result = await resolveRelationship(
        sourceValue,
        sourceDatasetId,
        sourceColumn,
        relationship
      );

      setResolved(result);
    } catch (err) {
      console.error('Error resolving relationship:', err);
      setError(err instanceof Error ? err.message : 'Error al resolver la relación');
    } finally {
      setLoading(false);
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

  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiLink size={20} />
          <Typography variant="h6">Relación de Dataset</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Relationship Configuration */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Configuración de la Relación
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Dataset destino:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {targetDatasetName}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Columna destino:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {relationship.targetColumnName}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Estrategia de coincidencia:
                  </Typography>
                  <Chip
                    label={getStrategyLabel(relationship.matchingStrategy)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                {relationship.matchingStrategy === 'fuzzy' && relationship.fuzzyThreshold && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Umbral de similitud:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {(relationship.fuzzyThreshold * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Resolution Result */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Resultado de la Resolución
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Valor de origen ({sourceColumnTitle}):
                  </Typography>
                  <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="body1" fontWeight="medium">
                      {String(sourceValue)}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Estado de coincidencia:
                    </Typography>
                    <Chip
                      icon={resolved?.matched ? <FiCheck /> : <FiX />}
                      label={resolved?.matched ? 'Encontrado' : 'No encontrado'}
                      size="small"
                      color={resolved?.matched ? 'success' : 'error'}
                    />
                  </Box>

                  {resolved?.matched && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Confianza:
                        </Typography>
                        <Chip
                          label={`${(resolved.confidence * 100).toFixed(0)}%`}
                          size="small"
                          color={getConfidenceColor(resolved.confidence)}
                        />
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Valor relacionado:
                        </Typography>
                        <Paper sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {Array.isArray(resolved.targetValue)
                              ? resolved.targetValue.join(', ')
                              : String(resolved.targetValue)}
                          </Typography>
                        </Paper>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Full Target Row (if available) */}
            {resolved?.matched && resolved.targetRow && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Datos Completos de la Fila Relacionada
                  </Typography>
                  <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Campo</strong></TableCell>
                          <TableCell><strong>Valor</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(resolved.targetRow).map(([key, value]) => {
                          // Check if value is a URL
                          const stringValue = value === null || value === undefined ? '' : String(value);
                          const isUrl = stringValue.match(/^https?:\/\//i);

                          return (
                            <TableRow key={key}>
                              <TableCell sx={{ fontWeight: 'medium' }}>{key}</TableCell>
                              <TableCell>
                                {value === null || value === undefined ? (
                                  <em style={{ color: 'gray' }}>null</em>
                                ) : isUrl ? (
                                  <a
                                    href={stringValue}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#1976d2',
                                      textDecoration: 'underline',
                                      wordBreak: 'break-all'
                                    }}
                                  >
                                    {stringValue}
                                  </a>
                                ) : (
                                  stringValue
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}

            {!resolved?.matched && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No se encontró una coincidencia para este valor. Esto puede deberse a:
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>El valor no existe en el dataset relacionado</li>
                  <li>La estrategia de coincidencia es muy estricta</li>
                  <li>El umbral de similitud (fuzzy matching) es muy alto</li>
                </ul>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationshipViewModal;
