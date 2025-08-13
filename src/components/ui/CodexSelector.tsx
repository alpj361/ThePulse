import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  // FormControlLabel,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  // IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  Audiotrack as AudioIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  TextFields as TextIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  FolderOpen as FolderIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getCodexItemsByUser, getLinksForParentItem } from '../../services/supabase.ts';

interface CodexItem {
  id: string;
  titulo: string;
  tipo: string;
  descripcion?: string;
  etiquetas: string[];
  proyecto: string;
  fecha: string;
  created_at: string;
  nombre_archivo?: string;
  tamano?: number;
  audio_transcription?: string;
  transcripcion?: string;
  document_analysis?: string;
  url?: string;
  // Campos de agrupamiento
  group_id?: string;
  is_group_parent?: boolean;
  group_name?: string;
  group_description?: string;
  part_number?: number;
  total_parts?: number;
  // Nuevo: campos del nuevo modelo
  original_type?: string;
  is_child_link?: boolean;
  parent_item_id?: string | null;
}

interface CodexSelectorProps {
  selectedCodex: string[];
  onCodexChange: (codex: string[]) => void;
}

const CodexSelector: React.FC<CodexSelectorProps> = ({
  selectedCodex,
  onCodexChange
}) => {
  const { user } = useAuth();
  const [codexItems, setCodexItems] = useState<CodexItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<CodexItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [groupedItems, setGroupedItems] = useState<Map<string, CodexItem[]>>(new Map());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // Estado para monitores y sus enlaces hijos
  const [expandedMonitors, setExpandedMonitors] = useState<Set<string>>(new Set());
  const [monitorChildren, setMonitorChildren] = useState<Record<string, any[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Record<string, boolean>>({});

  // Cargar items del codex disponibles
  useEffect(() => {
    if (user?.id) {
      loadCodexItems();
    }
  }, [user]);

  // Filtrar items por término de búsqueda y tipo
  useEffect(() => {
    let filtered = codexItems;

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.tipo === typeFilter);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.etiquetas.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nombre_archivo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered.slice(0, 50)); // Limitar a 50 items

    // Agrupar items filtrados
    const grouped = new Map<string, CodexItem[]>();
    filtered.forEach(item => {
      if (item.group_id) {
        if (!grouped.has(item.group_id)) {
          grouped.set(item.group_id, []);
        }
        grouped.get(item.group_id)!.push(item);
      }
    });
    setGroupedItems(grouped);
  }, [searchTerm, typeFilter, codexItems]);

  // Cargar hijos (enlaces) de un monitor on-demand
  const loadMonitorChildren = async (parentId: string) => {
    if (loadingChildren[parentId] || monitorChildren[parentId]) return;
    setLoadingChildren(prev => ({ ...prev, [parentId]: true }));
    try {
      const rows = await getLinksForParentItem(parentId);
      setMonitorChildren(prev => ({ ...prev, [parentId]: rows || [] }));
    } catch (e) {
      console.error('Error cargando enlaces del monitoreo', e);
      setMonitorChildren(prev => ({ ...prev, [parentId]: [] }));
    } finally {
      setLoadingChildren(prev => ({ ...prev, [parentId]: false }));
    }
  };

  const toggleMonitorExpansion = (parentId: string) => {
    const next = new Set(expandedMonitors);
    if (next.has(parentId)) {
      next.delete(parentId);
    } else {
      next.add(parentId);
      // Lazy load children
      loadMonitorChildren(parentId);
    }
    setExpandedMonitors(next);
  };

  const loadCodexItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const itemsData = await getCodexItemsByUser(user!.id);
      if (itemsData && itemsData.length > 0) {
        setCodexItems(itemsData);
      } else {
        setCodexItems([]);
      }
    } catch (err: any) {
      console.error('Error cargando items del codex:', err);
      setError('Error cargando items del codex: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const newSelection = selectedCodex.includes(itemId)
      ? selectedCodex.filter(id => id !== itemId)
      : [...selectedCodex, itemId];
    
    onCodexChange(newSelection);
  };

  // Helper: ítems planos realmente visibles (excluye enlaces hijos)
  const getDisplayFlatItems = () => filteredItems.filter((it: any) => !(it.original_type === 'link' && it.is_child_link));

  const handleSelectAll = () => {
    const allIds = getDisplayFlatItems().map(item => `codex_${item.id}`);
    onCodexChange(allIds);
  };

  const handleClearAll = () => {
    onCodexChange([]);
  };

  const handleSelectGroup = (groupId: string) => {
    const groupItems = groupedItems.get(groupId) || [];
    const groupIds = groupItems.map(item => `codex_${item.id}`);
    
    // Verificar si todos los items del grupo están seleccionados
    const allSelected = groupIds.every(id => selectedCodex.includes(id));
    
    if (allSelected) {
      // Deseleccionar todos los items del grupo
      const newSelection = selectedCodex.filter(id => !groupIds.includes(id));
      onCodexChange(newSelection);
    } else {
      // Seleccionar todos los items del grupo
      const newSelection = [...new Set([...selectedCodex, ...groupIds])];
      onCodexChange(newSelection);
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'documento':
        return <DocumentIcon sx={{ color: '#f44336' }} />;
      case 'audio':
        return <AudioIcon sx={{ color: '#ff9800' }} />;
      case 'video':
        return <VideoIcon sx={{ color: '#9c27b0' }} />;
      case 'enlace':
        return <LinkIcon sx={{ color: '#2196f3' }} />;
      case 'nota':
        return <TextIcon sx={{ color: '#4caf50' }} />;
      default:
        return <FolderIcon sx={{ color: '#757575' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAvailableTypes = () => {
    const types = [...new Set(codexItems.map(item => item.tipo))];
    return types.sort();
  };

  const hasTranscriptionOrAnalysis = (item: CodexItem) => {
    return !!(item.audio_transcription || item.transcripcion || item.document_analysis);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={32} />
        <Typography sx={{ ml: 2 }}>Cargando documentos...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadCodexItems} size="small" sx={{ ml: 1 }}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  // Separar items normales y agrupados
  const normalItems = filteredItems.filter(item => !item.group_id);
  // Monitoreos visibles (tipo item con original_type monitor)
  const monitorItems = normalItems.filter((it: any) => it.tipo === 'item' && (it.original_type === 'monitor'));
  // Excluir enlaces hijos del listado plano
  const flatItems = normalItems.filter((it: any) => !(it.original_type === 'link' && it.is_child_link));
  const groupedItemsArray = Array.from(groupedItems.entries());

  return (
    <Box>
      {/* Controles de búsqueda y filtros */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Buscar en tu codex..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Filtro por tipo */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Filtrar por tipo:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Todos"
              onClick={() => setTypeFilter('all')}
              color={typeFilter === 'all' ? 'primary' : 'default'}
              variant={typeFilter === 'all' ? 'filled' : 'outlined'}
              size="small"
            />
            {getAvailableTypes().map(tipo => (
              <Chip
                key={tipo}
                label={tipo}
                onClick={() => setTypeFilter(tipo)}
                color={typeFilter === tipo ? 'primary' : 'default'}
                variant={typeFilter === tipo ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            size="small"
            variant="outlined"
          >
            Seleccionar Todo
          </Button>
          <Button
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            size="small"
            variant="outlined"
          >
            Limpiar
          </Button>
        </Box>

        {selectedCodex.length > 0 && (
          <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
            ✅ {selectedCodex.length} documentos seleccionados
          </Typography>
        )}
      </Box>

      {/* Lista de items */}
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        {flatItems.length === 0 && monitorItems.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            {searchTerm || typeFilter !== 'all' ? 'No se encontraron documentos' : 'No hay documentos en tu codex'}
          </Typography>
        ) : (
          <Box>
            {/* Sección de Monitoreos */}
            {monitorItems.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Monitoreos</Typography>
                {monitorItems.map((item) => {
                  const parentId = item.id;
                  const itemKey = `codex_${parentId}`;
                  const isSelected = selectedCodex.includes(itemKey);
                  const isExpanded = expandedMonitors.has(parentId);
                  const children = monitorChildren[parentId] || [];
                  return (
                    <Accordion key={parentId} expanded={isExpanded} onChange={() => toggleMonitorExpansion(parentId)} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleItem(itemKey)}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            sx={{ mt: -0.5 }}
                          />
                          <FolderIcon sx={{ color: 'primary.main' }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{item.titulo}</Typography>
                            {item.descripcion && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.descripcion}</Typography>
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {loadingChildren[parentId] ? (
                          <Box sx={{ py: 1, pl: 1 }}><CircularProgress size={16} /></Box>
                        ) : (
                          <Box sx={{ pl: 1 }}>
                            {children.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">Sin enlaces</Typography>
                            ) : (
                              children.map((ln: any) => {
                                const child = ln.child;
                                const childKey = `codex_${child.id}`;
                                const childSelected = selectedCodex.includes(childKey);
                                return (
                                  <Card key={ln.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => handleToggleItem(childKey)}>
                                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        <Checkbox
                                          checked={childSelected}
                                          onChange={() => handleToggleItem(childKey)}
                                          size="small"
                                          sx={{ mt: -0.5 }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <LinkIcon sx={{ color: '#2196f3' }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                                            {child.titulo || 'Enlace'}
                                          </Typography>
                                          {child.source_url && (
                                            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                              {child.source_url}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                );
                              })
                            )}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
            {/* Items agrupados */}
            {groupedItemsArray.map(([groupId, groupItems]) => {
              const parentItem = groupItems.find(item => item.is_group_parent);
              const groupName = parentItem?.group_name || `Grupo ${groupId}`;
              const groupDescription = parentItem?.group_description || '';
              
              return (
                <Accordion 
                  key={groupId}
                  expanded={expandedGroups.has(groupId)}
                  onChange={() => toggleGroupExpansion(groupId)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Checkbox
                        checked={groupItems.every(item => selectedCodex.includes(`codex_${item.id}`))}
                        indeterminate={
                          groupItems.some(item => selectedCodex.includes(`codex_${item.id}`)) &&
                          !groupItems.every(item => selectedCodex.includes(`codex_${item.id}`))
                        }
                        onChange={() => handleSelectGroup(groupId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <FolderIcon sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {groupName} ({groupItems.length} elementos)
                        </Typography>
                        {groupDescription && (
                          <Typography variant="caption" color="text.secondary">
                            {groupDescription}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {groupItems.map(item => (
                      <Card 
                        key={item.id}
                        sx={{ 
                          mb: 1, 
                          border: selectedCodex.includes(`codex_${item.id}`) ? 2 : 1,
                          borderColor: selectedCodex.includes(`codex_${item.id}`) ? 'primary.main' : 'grey.300',
                          bgcolor: selectedCodex.includes(`codex_${item.id}`) ? 'primary.50' : 'background.paper',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 1
                          }
                        }}
                        onClick={() => handleToggleItem(`codex_${item.id}`)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Checkbox
                              checked={selectedCodex.includes(`codex_${item.id}`)}
                              onChange={() => handleToggleItem(`codex_${item.id}`)}
                              size="small"
                              sx={{ mt: -0.5 }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            {getTypeIcon(item.tipo)}
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 600,
                                  mb: 0.5,
                                  lineHeight: 1.3
                                }}
                              >
                                {item.titulo}
                                {item.part_number && (
                                  <Chip 
                                    label={`Parte ${item.part_number}/${item.total_parts}`}
                                    size="small"
                                    sx={{ ml: 1, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Typography>
                              
                              {item.descripcion && (
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
                                  {item.descripcion}
                                </Typography>
                              )}
                              
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                                <Chip 
                                  label={item.proyecto}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                
                                {item.etiquetas.slice(0, 3).map(tag => (
                                  <Chip 
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                ))}
                                
                                {hasTranscriptionOrAnalysis(item) && (
                                  <Chip 
                                    icon={<MicIcon />}
                                    label="Con análisis"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                {item.nombre_archivo && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.nombre_archivo}
                                  </Typography>
                                )}
                                
                                {item.tamano && (
                                  <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(item.tamano)}
                                  </Typography>
                                )}
                                
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(item.created_at)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionDetails>
                </Accordion>
              );
            })}

            {/* Items normales (no agrupados) */}
            {flatItems.map((item) => {
              const itemId = `codex_${item.id}`;
              const isSelected = selectedCodex.includes(itemId);
              
              return (
                <Card 
                  key={item.id}
                  sx={{ 
                    mb: 1, 
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'grey.300',
                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1
                    }
                  }}
                  onClick={() => handleToggleItem(itemId)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleItem(itemId)}
                        size="small"
                        sx={{ mt: -0.5 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {getTypeIcon(item.tipo)}
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            mb: 0.5,
                            lineHeight: 1.3
                          }}
                        >
                          {item.titulo}
                        </Typography>
                        
                        {item.descripcion && (
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
                            {item.descripcion}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={item.proyecto}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          
                          {item.etiquetas.slice(0, 3).map(tag => (
                            <Chip 
                              key={tag}
                              label={tag}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ))}
                          
                          {hasTranscriptionOrAnalysis(item) && (
                            <Chip 
                              icon={<MicIcon />}
                              label="Con análisis"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {item.nombre_archivo && (
                            <Typography variant="caption" color="text.secondary">
                              {item.nombre_archivo}
                            </Typography>
                          )}
                          
                          {item.tamano && (
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(item.tamano)}
                            </Typography>
                          )}
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CodexSelector; 