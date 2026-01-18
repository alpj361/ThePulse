import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    AlertTitle,
    Grid,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import { FiPlus, FiSearch, FiMap } from 'react-icons/fi';
import { mappingsService } from '../../services/mappings';
import type { BaseMapping } from '../../types/mappings';
import CreateMappingModal from './CreateMappingModal';
import MappingCard from './MappingCard';
import HemicicloEditor from './hemiciclo/HemicicloEditor';
import HemicicloDemo from './HemicicloDemo';
import RelationshipGraphDemo from './RelationshipGraphDemo';
import TimelineDemo from './TimelineDemo';

interface MappingsTabProps {
    projectId: string;
}

const MappingsTab: React.FC<MappingsTabProps> = ({ projectId }) => {
    const [mappings, setMappings] = useState<BaseMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState<BaseMapping | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [showRelationshipDemo, setShowRelationshipDemo] = useState(false);
    const [showTimelineDemo, setShowTimelineDemo] = useState(false);

    useEffect(() => {
        loadMappings();
    }, [projectId]);

    const loadMappings = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await mappingsService.listMappings({
                project_id: projectId
            });

            setMappings(data);
        } catch (err) {
            console.error('Error loading mappings:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar los mapeos');
        } finally {
            setLoading(false);
        }
    };

    const handleMappingCreated = (newMapping: BaseMapping) => {
        setIsCreating(false);
        setMappings(prev => [newMapping, ...prev]);
        // Open editor for new hemiciclo mapping
        if (newMapping.type === 'hemiciclo') {
            setSelectedMapping(newMapping);
            setEditMode(true);
        }
    };

    const handleMappingClick = (mapping: BaseMapping) => {
        setSelectedMapping(mapping);
        setEditMode(true);
    };

    const handleBackToList = () => {
        setSelectedMapping(null);
        setEditMode(false);
        loadMappings(); // Refresh the list
    };

    const handleMappingDelete = async (mappingId: string) => {
        try {
            await mappingsService.deleteMapping(mappingId);
            // Refresh the list after deletion
            loadMappings();
        } catch (err) {
            console.error('Error deleting mapping:', err);
            setError(err instanceof Error ? err.message : 'Error al eliminar el mapeo');
        }
    };

    const filteredMappings = mappings.filter(mapping => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            mapping.name.toLowerCase().includes(query) ||
            (mapping.description && mapping.description.toLowerCase().includes(query))
        );
    });

    // Show demos
    if (showDemo) {
        return <HemicicloDemo onBack={() => setShowDemo(false)} />;
    }

    if (showRelationshipDemo) {
        return <RelationshipGraphDemo onBack={() => setShowRelationshipDemo(false)} />;
    }

    if (showTimelineDemo) {
        return <TimelineDemo onBack={() => setShowTimelineDemo(false)} />;
    }

    // Si hay un mapeo seleccionado y es hemiciclo, mostrar editor
    if (selectedMapping && selectedMapping.type === 'hemiciclo' && editMode) {
        return (
            <HemicicloEditor
                mappingId={selectedMapping.id}
                projectId={projectId}
                onBack={handleBackToList}
                onSaved={() => {
                    console.log('Hemiciclo saved');
                }}
            />
        );
    }

    return (
        <Box className="mappings-tab" sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FiMap />
                        Mapeos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Organiza y visualiza información de actores y entidades
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<FiPlus />}
                    onClick={() => setIsCreating(true)}
                    disabled={loading}
                    sx={{
                        bgcolor: 'success.main',
                        '&:hover': { bgcolor: 'success.dark' }
                    }}
                >
                    Crear Mapeo
                </Button>
            </Box>

            {/* Demo Visualization Cards */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Demos de Visualización
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: 'primary.light',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => setShowDemo(true)}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ fontSize: 48, mb: 1 }}>🏛️</Box>
                                <Typography variant="h6" gutterBottom>
                                    Hemiciclo Parlamentario
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Visualización interactiva con animaciones
                                </Typography>
                                <Chip label="Demo Interactivo" color="primary" size="small" />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: 'primary.light',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => setShowRelationshipDemo(true)}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ fontSize: 48, mb: 1 }}>🌐</Box>
                                <Typography variant="h6" gutterBottom>
                                    Gráfico de Relaciones
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Red interactiva de conexiones entre actores
                                </Typography>
                                <Chip label="Demo Interactivo" color="primary" size="small" />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: 'primary.light',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => setShowTimelineDemo(true)}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ fontSize: 48, mb: 1 }}>📅</Box>
                                <Typography variant="h6" gutterBottom>
                                    Timeline Interactivo
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Línea de tiempo cronológica con eventos históricos
                                </Typography>
                                <Chip label="Demo Interactivo" color="primary" size="small" />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Search bar */}
            <TextField
                fullWidth
                placeholder="Buscar mapeos por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <FiSearch />
                        </InputAdornment>
                    )
                }}
                sx={{ mb: 3 }}
            />

            {/* Loading state */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error state */}
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>Error al cargar mapeos</AlertTitle>
                    {error}
                    <Button onClick={loadMappings} sx={{ mt: 1 }}>
                        Reintentar
                    </Button>
                </Alert>
            )}

            {/* Empty state */}
            {!loading && !error && filteredMappings.length === 0 && (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        px: 3,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '2px dashed',
                        borderColor: 'grey.300'
                    }}
                >
                    <FiMap size={48} color="#999" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" gutterBottom>
                        {searchQuery ? 'No se encontraron mapeos' : 'No hay mapeos todavía'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchQuery
                            ? 'Intenta con otros términos de búsqueda'
                            : 'Crea tu primer mapeo para organizar y visualizar información'}
                    </Typography>
                    {!searchQuery && (
                        <Button
                            variant="contained"
                            startIcon={<FiPlus />}
                            onClick={() => setIsCreating(true)}
                            sx={{
                                bgcolor: 'success.main',
                                '&:hover': { bgcolor: 'success.dark' }
                            }}
                        >
                            Crear Primer Mapeo
                        </Button>
                    )}
                </Box>
            )}

            {/* Mappings grid */}
            {!loading && !error && filteredMappings.length > 0 && (
                <Grid container spacing={3}>
                    {filteredMappings.map((mapping) => (
                        <Grid item xs={12} sm={6} md={4} key={mapping.id}>
                            <MappingCard
                                mapping={mapping}
                                onClick={() => handleMappingClick(mapping)}
                                onDelete={handleMappingDelete}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create Mapping Modal */}
            {isCreating && (
                <CreateMappingModal
                    projectId={projectId}
                    onClose={() => setIsCreating(false)}
                    onCreated={handleMappingCreated}
                />
            )}
        </Box>
    );
};

export default MappingsTab;
