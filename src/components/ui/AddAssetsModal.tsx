import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  Audiotrack as AudioIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  DriveFolderUpload as DriveIcon,
  Storage as StorageIcon,
  Mic as MicIcon,
  TextFields as TextIcon,
  FolderOpen as FolderIcon,
  SelectAll as SelectAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getAvailableCodexItems, assignCodexItemToProject } from '../../services/supabase';

interface CodexItem {
  id: string;
  titulo: string;
  tipo: string;
  descripcion?: string;
  etiquetas: string[];
  fecha: string;
  created_at: string;
  is_drive?: boolean;
  url?: string;
  nombre_archivo?: string;
  tamano?: number;
  audio_transcription?: string;
  transcripcion?: string;
  // Campos de agrupamiento
  group_id?: string;
  is_group_parent?: boolean;
  group_name?: string;
  group_description?: string;
  part_number?: number;
  total_parts?: number;
}

interface AddAssetsModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onAssetsAdded: (addedAssets: CodexItem[]) => void;
}

export const AddAssetsModal: React.FC<AddAssetsModalProps> = ({
  open,
  onClose,
  projectId,
  projectTitle,
  onAssetsAdded
}) => {
  const { user } = useAuth();
  const [availableItems, setAvailableItems] = useState<CodexItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transcriptionModalOpen, setTranscriptionModalOpen] = useState(false);
  const [transcriptionModalItem, setTranscriptionModalItem] = useState<CodexItem | null>(null);
  const [transcriptionType, setTranscriptionType] = useState<'audio' | 'text'>('audio');
  const [groupedItems, setGroupedItems] = useState<Map<string, CodexItem[]>>(new Map());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Cargar items disponibles del Codex
  useEffect(() => {
    if (open && user) {
      loadAvailableItems();
    }
  }, [open, user]);

  const loadAvailableItems = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const items = await getAvailableCodexItems(user.id);
      setAvailableItems(items);
      
      // Agrupar items por group_id
      const grouped = new Map<string, CodexItem[]>();
      items.forEach(item => {
        if (item.group_id) {
          if (!grouped.has(item.group_id)) {
            grouped.set(item.group_id, []);
          }
          grouped.get(item.group_id)!.push(item);
        }
      });
      setGroupedItems(grouped);
    } catch (err: any) {
      setError('Error cargando items del Codex: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar transcripción
  const handleShowTranscription = (item: CodexItem, type: 'audio' | 'text') => {
    const hasAudioTranscription = item.audio_transcription && item.audio_transcription.trim().length > 0;
    const hasTextTranscription = item.transcripcion && item.transcripcion.trim().length > 0;
    
    if (type === 'audio' && hasAudioTranscription) {
      setTranscriptionModalItem(item);
      setTranscriptionType('audio');
      setTranscriptionModalOpen(true);
    } else if (type === 'text' && hasTextTranscription) {
      setTranscriptionModalItem(item);
      setTranscriptionType('text');
      setTranscriptionModalOpen(true);
    } else {
      setError('No hay transcripción disponible para este elemento');
    }
  };

  // Seleccionar todo un grupo
  const handleSelectGroup = (groupId: string) => {
    const groupItems = groupedItems.get(groupId) || [];
    const newSelected = new Set(selectedItems);
    
    // Verificar si todos los items del grupo están seleccionados
    const allGroupSelected = groupItems.every(item => newSelected.has(item.id));
    
    if (allGroupSelected) {
      // Deseleccionar todos los items del grupo
      groupItems.forEach(item => newSelected.delete(item.id));
    } else {
      // Seleccionar todos los items del grupo
      groupItems.forEach(item => newSelected.add(item.id));
    }
    
    setSelectedItems(newSelected);
  };

  // Expandir/colapsar grupo
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Filtrar items según búsqueda y tipo
  const filteredItems = availableItems.filter(item => {
    // Mostrar items que son parent de grupo o items individuales (no parte de un grupo)
    // O items individuales de grupos expandidos
    const isDisplayable = item.is_group_parent || 
                          !item.group_id || 
                          (item.group_id && expandedGroups.has(item.group_id));
    
    const matchesSearch = searchTerm === '' || 
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.etiquetas.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.is_group_parent && item.group_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || item.tipo === typeFilter;
    
    return isDisplayable && matchesSearch && matchesType;
  });

  // Ordenar items para mostrar primero los parents de grupo, luego sus hijos
  const sortedFilteredItems = filteredItems.sort((a, b) => {
    // Si ambos tienen el mismo group_id, el parent va primero
    if (a.group_id === b.group_id) {
      if (a.is_group_parent && !b.is_group_parent) return -1;
      if (!a.is_group_parent && b.is_group_parent) return 1;
      // Si ambos son del mismo grupo y no son parents, ordenar por part_number
      if (!a.is_group_parent && !b.is_group_parent) {
        return (a.part_number || 0) - (b.part_number || 0);
      }
    }
    // Ordenar por fecha por defecto
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Manejar selección de items
  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Asignar items seleccionados al proyecto
  const handleAssignItems = async () => {
    if (selectedItems.size === 0) {
      setError('Selecciona al menos un activo para agregar');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const addedAssets: CodexItem[] = [];
      
      for (const itemId of selectedItems) {
        await assignCodexItemToProject(itemId, projectId);
        const item = availableItems.find(i => i.id === itemId);
        if (item) {
          addedAssets.push(item);
        }
      }

      setSuccess(`✅ ${addedAssets.length} activo(s) agregado(s) exitosamente`);
      onAssetsAdded(addedAssets);
      
      // Recargar items disponibles
      await loadAvailableItems();
      setSelectedItems(new Set());
      
      // Cerrar modal después de un momento
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setError('Error asignando activos: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Obtener icono según tipo de archivo
  const getTypeIcon = (tipo: string, isDrive: boolean = false) => {
    const iconStyle = { mr: 1 };
    
    if (isDrive) {
      return <DriveIcon sx={{ ...iconStyle, color: '#4285f4' }} />;
    }
    
    switch (tipo) {
      case 'documento':
        return <DocumentIcon sx={{ ...iconStyle, color: '#f44336' }} />;
      case 'audio':
        return <AudioIcon sx={{ ...iconStyle, color: '#ff9800' }} />;
      case 'video':
        return <VideoIcon sx={{ ...iconStyle, color: '#9c27b0' }} />;
      case 'enlace':
        return <LinkIcon sx={{ ...iconStyle, color: '#2196f3' }} />;
      default:
        return <StorageIcon sx={{ ...iconStyle, color: '#757575' }} />;
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="div">
            Agregar Activos al Proyecto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projectTitle}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por título, descripción o etiquetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="Todos"
                  onClick={() => setTypeFilter('all')}
                  color={typeFilter === 'all' ? 'primary' : 'default'}
                  variant={typeFilter === 'all' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Documentos"
                  onClick={() => setTypeFilter('documento')}
                  color={typeFilter === 'documento' ? 'primary' : 'default'}
                  variant={typeFilter === 'documento' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Audio"
                  onClick={() => setTypeFilter('audio')}
                  color={typeFilter === 'audio' ? 'primary' : 'default'}
                  variant={typeFilter === 'audio' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Video"
                  onClick={() => setTypeFilter('video')}
                  color={typeFilter === 'video' ? 'primary' : 'default'}
                  variant={typeFilter === 'video' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Enlaces"
                  onClick={() => setTypeFilter('enlace')}
                  color={typeFilter === 'enlace' ? 'primary' : 'default'}
                  variant={typeFilter === 'enlace' ? 'filled' : 'outlined'}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista de items disponibles */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : sortedFilteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {availableItems.length === 0 
                ? "No hay activos disponibles en el Codex" 
                : "No se encontraron activos con los filtros aplicados"
              }
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {sortedFilteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: selectedItems.has(item.id) ? 2 : 1,
                    borderColor: selectedItems.has(item.id) ? 'primary.main' : 'divider',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      borderColor: 'primary.light'
                    },
                    // Styling especial para elementos individuales de grupo expandido
                    ...(item.group_id && !item.is_group_parent && {
                      ml: 2,
                      borderLeft: '3px solid',
                      borderLeftColor: 'primary.main',
                      backgroundColor: 'grey.50'
                    })
                  }}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleItemToggle(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label=""
                        sx={{ m: 0, mr: 1 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          {getTypeIcon(item.tipo, item.is_drive)}
                          <Typography 
                            variant="subtitle2" 
                            noWrap
                            sx={{ fontWeight: 600 }}
                          >
                            {item.is_group_parent ? item.group_name : item.titulo}
                          </Typography>
                          {item.is_group_parent && (
                            <Chip
                              size="small"
                              label={`${item.total_parts || 0} elementos`}
                              sx={{ ml: 1, fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                          {item.group_id && !item.is_group_parent && (
                            <Chip
                              size="small"
                              label={`Parte ${item.part_number || 1} de ${item.total_parts || 1}`}
                              sx={{ ml: 1, fontSize: '0.7rem', height: 18, backgroundColor: 'primary.light', color: 'white' }}
                            />
                          )}
                        </Box>
                        
                        {(item.descripcion || item.group_description) && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {item.group_description || item.descripcion}
                          </Typography>
                        )}

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.fecha).toLocaleDateString()}
                            {item.tamano && ` • ${formatFileSize(item.tamano)}`}
                          </Typography>
                        </Box>

                        {/* Indicadores de transcripción y selección de grupo */}
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                          {item.audio_transcription && (
                            <Chip
                              icon={<MicIcon />}
                              label="Audio"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20, cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowTranscription(item, 'audio');
                              }}
                            />
                          )}
                          {item.transcripcion && (
                            <Chip
                              icon={<TextIcon />}
                              label="Texto"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20, cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowTranscription(item, 'text');
                              }}
                            />
                          )}
                          {item.is_group_parent && (
                            <>
                              <Chip
                                icon={<SelectAllIcon />}
                                label="Seleccionar grupo"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20, cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectGroup(item.group_id!);
                                }}
                              />
                              <Chip
                                icon={expandedGroups.has(item.group_id!) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                label={expandedGroups.has(item.group_id!) ? "Colapsar" : "Expandir"}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20, cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGroupExpansion(item.group_id!);
                                }}
                              />
                            </>
                          )}
                        </Box>

                        {item.etiquetas.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {item.etiquetas.slice(0, 3).map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                            {item.etiquetas.length > 3 && (
                              <Chip
                                label={`+${item.etiquetas.length - 3}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={assigning}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleAssignItems}
          disabled={selectedItems.size === 0 || assigning}
          startIcon={assigning ? <CircularProgress size={20} /> : null}
        >
          {assigning 
            ? 'Agregando...' 
            : `Agregar ${selectedItems.size} activo${selectedItems.size !== 1 ? 's' : ''}`
          }
        </Button>
      </DialogActions>

      {/* Modal de transcripción */}
      <Dialog
        open={transcriptionModalOpen}
        onClose={() => setTranscriptionModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {transcriptionType === 'audio' ? (
              <MicIcon sx={{ color: 'primary.main' }} />
            ) : (
              <TextIcon sx={{ color: 'success.main' }} />
            )}
            <Typography variant="h6">
              Transcripción de {transcriptionType === 'audio' ? 'Audio' : 'Texto'}
            </Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {transcriptionModalItem?.is_group_parent ? 
              transcriptionModalItem.group_name : 
              transcriptionModalItem?.titulo
            }
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            maxHeight: '60vh', 
            overflowY: 'auto',
            p: 2,
            backgroundColor: 'grey.50',
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {transcriptionType === 'audio' ? 
                transcriptionModalItem?.audio_transcription :
                transcriptionModalItem?.transcripcion
              }
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranscriptionModalOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AddAssetsModal; 