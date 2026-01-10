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
    Tooltip
} from '@mui/material';
import { FiSave, FiRefreshCw, FiArrowLeft, FiMousePointer, FiX } from 'react-icons/fi';
import HemicicloSVG from './HemicicloSVG';
import CategoryPanel from './CategoryPanel';
import CategoryLegend from './CategoryLegend';
import DataSourceSelector from './DataSourceSelector';
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
                                    photo: photoCol ? row[photoCol] : undefined
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
                    <Typography variant="h5" fontWeight="bold">
                        {mappingName}
                    </Typography>
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

            <Grid container spacing={3}>
                {/* Left panel - Configuration */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <DataSourceSelector
                            projectId={projectId}
                            dataSource={config.dataSource}
                            onDataSourceChange={handleDataSourceChange}
                        />
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <CategoryPanel
                            categories={data.categories}
                            onCategoriesChange={handleCategoriesChange}
                            selectedCategoryId={selectedCategoryId}
                            onCategorySelect={handleCategorySelect}
                        />
                    </Paper>
                </Grid>

                {/* Right panel - Visualization */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <CategoryLegend
                                categories={data.categories}
                                showCounts
                                onCategoryClick={handleCategorySelect}
                                selectedCategoryId={selectedCategoryId}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                                width={700}
                                height={400}
                                editable={true}
                            />
                        </Box>

                        {/* Note: Seat details now shown in popover menu inside SVG */}
                    </Paper>

                    {/* Stats */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                            <Typography variant="h5" color="primary.main" fontWeight="bold">
                                {config.layout.totalSeats}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                            <Typography variant="h5" color="success.main" fontWeight="bold">
                                {data.seats.filter(s => s.categoryId).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Asignados
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                            <Typography variant="h5" color="text.secondary" fontWeight="bold">
                                {data.categories.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Categorías
                            </Typography>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HemicicloEditor;
