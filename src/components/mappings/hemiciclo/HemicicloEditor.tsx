import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Alert,
    CircularProgress,
    Chip,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Avatar,
    TextField,
    IconButton
} from '@mui/material';
import { FiSave, FiRefreshCw, FiArrowLeft, FiMousePointer, FiX, FiChevronDown, FiUser, FiMapPin, FiTrash2, FiEdit2, FiCheck } from 'react-icons/fi';
import HemicicloSVG from './HemicicloSVG';
import CategoryPanel from './CategoryPanel';
import CategoryLegend from './CategoryLegend';
import DataSourceSelector from './DataSourceSelector';
import CustomFieldsEditor from './CustomFieldsEditor';
import CustomFieldsDisplay from './CustomFieldsDisplay';
import { mappingsService } from '../../../services/mappings';
import {
    HemicicloConfig,
    HemicicloData,
    HemicicloCategory,
    HemicicloSeat,
    calculateDefaultLayout,
    generateEmptySeats
} from '../../../types/mappings';
import { datasetsService } from '../../../services/datasets';
import { parseListValues } from '../../../utils/dataUtils';

interface HemicicloEditorProps {
    mappingId: string;
    projectId: string;
    onBack: () => void;
    onSaved?: () => void;
}

const HemicicloEditor: React.FC<HemicicloEditorProps> = ({
    mappingId,
    projectId,
    onBack,
    onSaved
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [config, setConfig] = useState<HemicicloConfig | null>(null);
    const [data, setData] = useState<HemicicloData | null>(null);
    const [mappingName, setMappingName] = useState('');
    const [selectedSeatId, setSelectedSeatId] = useState<string | undefined>();
    const [hasChanges, setHasChanges] = useState(false);

    // Click-to-assign mode
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
    const [assignMode, setAssignMode] = useState(false);

    // Edit name mode
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    // Load mapping data
    useEffect(() => {
        const loadMapping = async () => {
            setLoading(true);
            try {
                const mapping = await mappingsService.getMappingById(mappingId);
                if (mapping) {
                    setMappingName(mapping.name);

                    // Parse config
                    const mappingConfig = mapping.config as HemicicloConfig;
                    if (mappingConfig?.layout) {
                        setConfig(mappingConfig);
                    } else {
                        // Generate default if not set
                        const totalSeats = (mapping.config as any)?.totalSeats || 100;
                        const defaultLayout = calculateDefaultLayout(totalSeats);
                        setConfig({ layout: defaultLayout });
                    }

                    // Parse data
                    const mappingData = mapping.data as HemicicloData;
                    if (mappingData?.seats) {
                        setData(mappingData);
                    } else {
                        // Generate empty seats
                        const layout = mappingConfig?.layout || calculateDefaultLayout(100);
                        setData({
                            categories: [],
                            seats: generateEmptySeats(layout)
                        });
                    }
                }
            } catch (err) {
                console.error('Error loading mapping:', err);
                setError('Error al cargar el mapeo');
            } finally {
                setLoading(false);
            }
        };

        loadMapping();
    }, [mappingId]);

    // Handle category changes
    const handleCategoriesChange = (categories: HemicicloCategory[]) => {
        if (!data) return;

        // Update seat counts
        const updatedCategories = categories.map(cat => ({
            ...cat,
            seatCount: data.seats.filter(s => s.categoryId === cat.id).length
        }));

        setData({ ...data, categories: updatedCategories });
        setHasChanges(true);
    };

    // Handle category selection for assign mode
    const handleCategorySelect = (categoryId: string) => {
        if (selectedCategoryId === categoryId) {
            // Deselect
            setSelectedCategoryId(undefined);
            setAssignMode(false);
        } else {
            setSelectedCategoryId(categoryId);
            setAssignMode(true);
        }
    };

    // Handle data source changes
    const handleDataSourceChange = (dataSource: HemicicloConfig['dataSource']) => {
        if (!config) return;
        setConfig({ ...config, dataSource });
        setHasChanges(true);
    };

    // Load custom fields data from primary and related datasets
    const loadCustomFieldsData = async (
        customFields: import('../../../types/mappings').CustomField[],
        primaryRows: any[],
        actorColumnName: string
    ): Promise<Record<string, Record<string, any>>> => {
        const result: Record<string, Record<string, any>> = {};

        // Initialize metadata for each actor
        primaryRows.forEach(row => {
            const actorName = String(row[actorColumnName]);
            result[actorName] = {};
        });

        // Process each custom field
        for (const field of customFields) {
            if (field.sourceType === 'column') {
                // Simple: read from primary dataset
                primaryRows.forEach(row => {
                    const actorName = String(row[actorColumnName]);
                    const value = row[field.columnName!];
                    if (value !== null && value !== undefined) {
                        result[actorName][field.id] = value;
                    }
                });

            } else if (field.sourceType === 'dataset') {
                // Complex: load and join related dataset
                try {
                    const relatedData = await datasetsService.getDatasetData(
                        field.relatedDatasetId!
                    );

                    // Build lookup map for O(1) access
                    const lookupMap = new Map<string, any[]>();
                    relatedData.forEach((relatedRow: any) => {
                        const rawKey = relatedRow[field.keyColumnRelated!];
                        const keys = parseListValues(rawKey);

                        keys.forEach(key => {
                            if (!lookupMap.has(key)) {
                                lookupMap.set(key, []);
                            }
                            lookupMap.get(key)!.push(relatedRow);
                        });
                    });

                    // Join with primary data
                    primaryRows.forEach(row => {
                        const actorName = String(row[actorColumnName]);
                        const localKey = String(row[field.keyColumnLocal!]);
                        const matches = lookupMap.get(localKey) || [];

                        if (matches.length === 0) {
                            // No match - skip
                        } else if (matches.length === 1) {
                            // Single match - extract value
                            result[actorName][field.id] = matches[0][field.valueColumn!];
                        } else {
                            // Multiple matches - create array
                            result[actorName][field.id] = matches.map(
                                m => m[field.valueColumn!]
                            );
                        }
                    });

                } catch (error) {
                    console.error(`Error loading custom field ${field.label}:`, error);
                    // Continue with other fields
                }
            }
        }

        return result;
    };

    // Auto-assign seats from dataset
    const handleAutoAssign = async () => {
        if (!config?.dataSource?.datasetIds?.length || !config.dataSource.columnMappings?.actor) {
            return;
        }

        try {
            setLoading(true);

            // Load data from datasets
            const allRows: any[] = [];
            for (const dsId of config.dataSource.datasetIds) {
                const dsData = await datasetsService.getDatasetData(dsId);
                allRows.push(...dsData);
            }

            const actorCol = config.dataSource.columnMappings.actor;
            const categoryCol = config.dataSource.columnMappings.category;
            const photoCol = config.dataSource.columnMappings.photo;

            // Load custom fields data
            let customFieldsDataMap: Record<string, Record<string, any>> = {};
            if (config.dataSource?.customFields && config.dataSource.customFields.length > 0) {
                customFieldsDataMap = await loadCustomFieldsData(
                    config.dataSource.customFields,
                    allRows,
                    actorCol
                );
            }

            // Create categories from unique values
            const uniqueCategories = new Set<string>();
            allRows.forEach(row => {
                if (categoryCol && row[categoryCol]) {
                    uniqueCategories.add(String(row[categoryCol]));
                }
            });

            // Generate category objects with colors
            const categoryColors = [
                '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
                '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395'
            ];

            const newCategories: HemicicloCategory[] = Array.from(uniqueCategories).map((name, index) => ({
                id: `cat-${index + 1}`,
                name,
                color: categoryColors[index % categoryColors.length],
                order: index + 1
            }));

            // Assign actors to seats
            const newSeats = [...(data?.seats || [])];
            let seatIndex = 0;

            // Group rows by category for ordered assignment
            const rowsByCategory = new Map<string, any[]>();
            allRows.forEach(row => {
                const catName = categoryCol ? String(row[categoryCol] || '') : 'Sin categoría';
                if (!rowsByCategory.has(catName)) {
                    rowsByCategory.set(catName, []);
                }
                rowsByCategory.get(catName)!.push(row);
            });

            // Assign in order by category
            for (const category of newCategories) {
                const rows = rowsByCategory.get(category.name) || [];
                for (const row of rows) {
                    if (seatIndex < newSeats.length) {
                        const actorName = row[actorCol];
                        if (actorName) {
                            newSeats[seatIndex] = {
                                ...newSeats[seatIndex],
                                categoryId: category.id,
                                actorData: {
                                    name: String(actorName),
                                    photo: photoCol ? row[photoCol] : undefined,
                                    metadata: customFieldsDataMap[actorName] || {}
                                }
                            };
                            seatIndex++;
                        }
                    }
                }
            }

            // Update categories with seat counts
            const categoriesWithCounts = newCategories.map(cat => ({
                ...cat,
                seatCount: newSeats.filter(s => s.categoryId === cat.id).length
            }));

            setData({
                categories: categoriesWithCounts,
                seats: newSeats
            });
            setHasChanges(true);

        } catch (err) {
            console.error('Error auto-assigning:', err);
            setError('Error al asignar automáticamente');
        } finally {
            setLoading(false);
        }
    };

    // Save changes
    const handleSave = async () => {
        if (!config || !data) return;

        setSaving(true);
        try {
            await mappingsService.updateMapping(mappingId, {
                config,
                data
            });
            setHasChanges(false);
            onSaved?.();
        } catch (err) {
            console.error('Error saving:', err);
            setError('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    // Save name
    const handleSaveName = async () => {
        if (!tempName.trim()) {
            setEditingName(false);
            setTempName(mappingName);
            return;
        }

        try {
            await mappingsService.updateMapping(mappingId, {
                name: tempName.trim()
            });
            setMappingName(tempName.trim());
            setEditingName(false);
            onSaved?.();
        } catch (err) {
            console.error('Error updating name:', err);
            setError('Error al actualizar el nombre');
            setTempName(mappingName);
            setEditingName(false);
        }
    };

    const handleStartEditName = () => {
        setTempName(mappingName);
        setEditingName(true);
    };

    const handleCancelEditName = () => {
        setTempName(mappingName);
        setEditingName(false);
    };

    // Handle seat assignment logic
    const updateSeatAssignment = (seatId: string, categoryId: string | undefined) => {
        if (!data) return;

        const updatedSeats = data.seats.map(s => {
            if (s.id === seatId) {
                return { ...s, categoryId: categoryId, actorData: categoryId ? s.actorData : undefined };
            }
            return s;
        });

        // Update category counts
        const updatedCategories = data.categories.map(cat => ({
            ...cat,
            seatCount: updatedSeats.filter(s => s.categoryId === cat.id).length
        }));

        setData({ categories: updatedCategories, seats: updatedSeats });
        setHasChanges(true);
    };

    // Handle seat click - assign category if in assign mode, else select
    const handleSeatClick = (seat: HemicicloSeat) => {
        if (!data) return;

        if (assignMode && selectedCategoryId) {
            // Assign the selected category to this seat
            // Toggle: if same category, remove it; otherwise assign
            const newCategoryId = seat.categoryId === selectedCategoryId ? undefined : selectedCategoryId;
            updateSeatAssignment(seat.id, newCategoryId);
        } else {
            // Just select the seat to show menu
            setSelectedSeatId(seat.id === selectedSeatId ? undefined : seat.id);
        }
    };

    // Handle clear assignment from a seat (via menu or button)
    const handleClearSeat = (seat: HemicicloSeat) => {
        updateSeatAssignment(seat.id, undefined);
    };

    // Handle assign category from menu
    const handleAssignSeat = (seat: HemicicloSeat, categoryId: string) => {
        updateSeatAssignment(seat.id, categoryId);
    };

    // Clear selection on background click
    const handleBackgroundClick = () => {
        setSelectedSeatId(undefined);
    };

    if (loading && !config) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!config || !data) return null;

    const selectedCategory = data.categories.find(c => c.id === selectedCategoryId);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button startIcon={<FiArrowLeft />} onClick={onBack}>
                        Volver
                    </Button>
                    {editingName ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveName();
                                    } else if (e.key === 'Escape') {
                                        handleCancelEditName();
                                    }
                                }}
                                size="small"
                                autoFocus
                                sx={{ minWidth: 300 }}
                            />
                            <IconButton size="small" color="primary" onClick={handleSaveName}>
                                <FiCheck />
                            </IconButton>
                            <IconButton size="small" onClick={handleCancelEditName}>
                                <FiX />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h5" fontWeight="bold">
                                {mappingName}
                            </Typography>
                            <IconButton size="small" onClick={handleStartEditName}>
                                <FiEdit2 size={18} />
                            </IconButton>
                        </Box>
                    )}
                    {hasChanges && (
                        <Typography variant="caption" color="warning.main">
                            (cambios sin guardar)
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FiRefreshCw />}
                        onClick={handleAutoAssign}
                        disabled={saving || !config.dataSource?.datasetIds?.length}
                    >
                        Auto-asignar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<FiSave />}
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Box>
            </Box>

            {/* Assign mode indicator */}
            {assignMode && selectedCategory && (
                <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    icon={<FiMousePointer />}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<FiX />}
                            onClick={() => {
                                setAssignMode(false);
                                setSelectedCategoryId(undefined);
                            }}
                        >
                            Cancelar
                        </Button>
                    }
                >
                    <strong>Modo asignación:</strong> Click en los asientos para asignar{' '}
                    <Chip
                        label={selectedCategory.name}
                        size="small"
                        sx={{
                            bgcolor: selectedCategory.color,
                            color: '#fff',
                            ml: 1
                        }}
                    />
                </Alert>
            )}

            {/* Main Layout: Visualization on top, Controls and Stats below */}

            {/* Data Source Configuration - Collapsible */}
            <Accordion
                defaultExpanded={!config.dataSource?.datasetIds?.length}
                sx={{ mb: 3, boxShadow: 2 }}
            >
                <AccordionSummary
                    expandIcon={<FiChevronDown />}
                    sx={{
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Fuente de Datos
                        </Typography>
                        {config.dataSource?.datasetIds && config.dataSource.datasetIds.length > 0 && (
                            <Chip
                                label={`${config.dataSource.datasetIds.length} dataset(s) vinculados`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <DataSourceSelector
                        projectId={projectId}
                        dataSource={config.dataSource}
                        onDataSourceChange={handleDataSourceChange}
                    />
                </AccordionDetails>
            </Accordion>

            {/* Custom Fields Editor */}
            {config.dataSource?.datasetIds && config.dataSource.datasetIds.length > 0 && (
                <CustomFieldsEditor
                    dataSource={config.dataSource}
                    projectId={projectId}
                    onDataSourceChange={handleDataSourceChange}
                />
            )}

            {/* Hemiciclo with Sidebar Layout */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Hemiciclo Visualization - 75% */}
                <Grid item xs={12} lg={9}>
                    <Paper
                        sx={{
                            p: { xs: 2, md: 3 },
                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                            overflow: 'hidden',
                            minHeight: 500
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: 1200,
                            mx: 'auto',
                            '& > div': {
                                width: '100% !important',
                                maxWidth: '100%'
                            }
                        }}>
                            <HemicicloSVG
                                layout={config.layout}
                                seats={data.seats}
                                categories={data.categories}
                                onSeatClick={handleSeatClick}
                                onBackgroundClick={handleBackgroundClick}
                                onAssignSeat={handleAssignSeat}
                                onClearSeat={handleClearSeat}
                                selectedSeatId={selectedSeatId}
                                selectedCategoryId={selectedCategoryId}
                                width={1200}
                                height={600}
                                editable={true}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Information Sidebar - 25% */}
                <Grid item xs={12} lg={3}>
                    <Paper
                        sx={{
                            p: 2,
                            position: 'sticky',
                            top: 16,
                            minHeight: 500,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiUser />
                            Información del Escaño
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {selectedSeatId && data.seats.find(s => s.id === selectedSeatId) ? (
                            (() => {
                                const seat = data.seats.find(s => s.id === selectedSeatId)!;
                                const category = data.categories.find(c => c.id === seat.categoryId);

                                return (
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Actor Photo */}
                                        {seat.actorData?.photo && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                <Avatar
                                                    src={seat.actorData.photo}
                                                    alt={seat.actorData.name}
                                                    sx={{
                                                        width: 120,
                                                        height: 120,
                                                        border: '4px solid',
                                                        borderColor: category?.color || 'grey.300',
                                                        boxShadow: 3
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        {/* Actor Name */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                Nombre
                                            </Typography>
                                            <Typography variant="h6" fontWeight={600}>
                                                {seat.actorData?.name || `Asiento ${seat.row + 1}-${seat.position + 1}`}
                                            </Typography>
                                        </Box>

                                        {/* Category/Party */}
                                        {category && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    Partido/Categoría
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            bgcolor: category.color,
                                                            border: '2px solid #fff',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }}
                                                    />
                                                    <Typography variant="body1" fontWeight={500}>
                                                        {category.name}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Position Info */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                <FiMapPin style={{ display: 'inline', marginRight: 4 }} />
                                                Ubicación
                                            </Typography>
                                            <Typography variant="body2">
                                                Fila {seat.row + 1}, Posición {seat.position + 1}
                                            </Typography>
                                        </Box>

                                        {/* Custom Fields Display */}
                                        {seat.actorData?.metadata && config.dataSource?.customFields && (
                                            <CustomFieldsDisplay
                                                customFields={config.dataSource.customFields}
                                                metadata={seat.actorData.metadata}
                                            />
                                        )}

                                        <Divider />

                                        {/* Actions */}
                                        <Box sx={{ mt: 'auto' }}>
                                            {seat.categoryId ? (
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<FiTrash2 />}
                                                    onClick={() => handleClearSeat(seat)}
                                                >
                                                    Limpiar Asignación
                                                </Button>
                                            ) : (
                                                <Box>
                                                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                                                        Asignar categoría:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {data.categories.map(cat => (
                                                            <Tooltip key={cat.id} title={cat.name}>
                                                                <Box
                                                                    onClick={() => handleAssignSeat(seat, cat.id)}
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        borderRadius: '50%',
                                                                        bgcolor: cat.color,
                                                                        border: '3px solid #fff',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: '#fff',
                                                                        fontWeight: 'bold',
                                                                        fontSize: 12,
                                                                        cursor: 'pointer',
                                                                        transition: 'transform 0.2s',
                                                                        '&:hover': {
                                                                            transform: 'scale(1.15)',
                                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                                        }
                                                                    }}
                                                                >
                                                                    {cat.seatCount || 0}
                                                                </Box>
                                                            </Tooltip>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })()
                        ) : (
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                    py: 8
                                }}
                            >
                                <FiUser size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                                <Typography variant="body1" color="text.secondary">
                                    Selecciona un escaño para ver su información
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    Haz clic en cualquier asiento del hemiciclo
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Grid: Stats + Categories */}
            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Estadísticas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
                            <Typography variant="h3" color="primary.main" fontWeight="bold">
                                {config.layout.totalSeats}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Total
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
                            <Typography variant="h3" color="success.main" fontWeight="bold">
                                {data.seats.filter(s => s.categoryId).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Asignados
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
                            <Typography variant="h3" color="text.secondary" fontWeight="bold">
                                {data.categories.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Categorías
                            </Typography>
                        </Paper>
                    </Box>
                </Grid>

                {/* Category Management */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Categorías / Partidos
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {data.categories.length} categorías
                            </Typography>
                        </Box>

                        {/* Si hay dataset conectado, mostrar solo vista de lectura */}
                        {config.dataSource?.datasetIds && config.dataSource.datasetIds.length > 0 ? (
                            <>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Las categorías están vinculadas al dataset. Edita los datos desde el dataset original.
                                </Alert>
                                {data.categories.length > 0 ? (
                                    <Box
                                        sx={{
                                            maxHeight: 400,
                                            overflowY: 'auto',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                            gap: 1,
                                            pr: 1,
                                            '&::-webkit-scrollbar': {
                                                width: '8px',
                                            },
                                            '&::-webkit-scrollbar-track': {
                                                background: '#f1f1f1',
                                                borderRadius: '4px',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                background: '#888',
                                                borderRadius: '4px',
                                                '&:hover': {
                                                    background: '#555',
                                                },
                                            },
                                        }}
                                    >
                                        {data.categories
                                            .sort((a, b) => (b.seatCount || 0) - (a.seatCount || 0))
                                            .map(category => (
                                                <Box
                                                    key={category.id}
                                                    onClick={() => handleCategorySelect(category.id)}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        cursor: 'pointer',
                                                        bgcolor: selectedCategoryId === category.id ? 'action.selected' : 'transparent',
                                                        border: '2px solid',
                                                        borderColor: selectedCategoryId === category.id ? category.color : 'transparent',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                            borderColor: category.color,
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            bgcolor: category.color,
                                                            border: '2px solid #fff',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            flex: 1,
                                                            fontWeight: 500,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {category.name}
                                                    </Typography>
                                                    <Chip
                                                        label={category.seatCount || 0}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: category.color,
                                                            color: '#fff',
                                                            fontWeight: 'bold',
                                                            minWidth: 36,
                                                            height: 24
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No hay categorías definidas. Usa "Auto-asignar" para generar desde el dataset.
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        ) : (
                            /* Si NO hay dataset, mostrar CategoryPanel para edición manual */
                            <CategoryPanel
                                categories={data.categories}
                                onCategoriesChange={handleCategoriesChange}
                                selectedCategoryId={selectedCategoryId}
                                onCategorySelect={handleCategorySelect}
                            />
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HemicicloEditor;
