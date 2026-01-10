import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    Typography,
    Alert,
    Slider,
    Select,
    MenuItem,
    InputLabel,
    Chip,
    Divider,
    Switch
} from '@mui/material';
import { FiMap, FiDatabase, FiZap } from 'react-icons/fi';
import { mappingsService } from '../../services/mappings';
import { datasetsService, Dataset } from '../../services/datasets';
import { useAdmin } from '../../hooks/useAdmin';
import type { BaseMapping, MappingType, HemicicloDataSource, HemicicloData } from '../../types/mappings';
import { calculateDefaultLayout, generateEmptySeats } from '../../types/mappings';
import { generateRandomHemicicloData } from './mockHemicicloData';

interface CreateMappingModalProps {
    projectId: string;
    onClose: () => void;
    onCreated: (mapping: BaseMapping) => void;
}

const CreateMappingModal: React.FC<CreateMappingModalProps> = ({
    projectId,
    onClose,
    onCreated
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<MappingType>('hemiciclo');
    const [seatCount, setSeatCount] = useState<number>(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Admin check
    const { isAdmin } = useAdmin();

    // Dataset selection
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loadingDatasets, setLoadingDatasets] = useState(false);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [seatSource, setSeatSource] = useState<'manual' | 'dataset'>('manual');

    // Mock data option (admin only)
    const [useMockData, setUseMockData] = useState(false);

    // Load datasets on mount
    useEffect(() => {
        const loadDatasets = async () => {
            setLoadingDatasets(true);
            try {
                const data = await datasetsService.listDatasets({
                    project_id: projectId,
                    visibility: 'all'
                });
                setDatasets(data);
            } catch (err) {
                console.error('Error loading datasets:', err);
            } finally {
                setLoadingDatasets(false);
            }
        };
        loadDatasets();
    }, [projectId]);

    // Update seat count when dataset is selected
    useEffect(() => {
        if (selectedDatasetId) {
            const ds = datasets.find(d => d.id === selectedDatasetId);
            if (ds) {
                setSelectedDataset(ds);
                if (seatSource === 'dataset') {
                    setSeatCount(ds.row_count || 0);
                }
            }
        } else {
            setSelectedDataset(null);
        }
    }, [selectedDatasetId, datasets, seatSource]);

    const handleSeatSourceChange = (source: 'manual' | 'dataset') => {
        setSeatSource(source);
        if (source === 'dataset' && selectedDataset) {
            setSeatCount(selectedDataset.row_count || 0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('El nombre es requerido');
            return;
        }

        if (seatCount < 1) {
            setError('Debe haber al menos 1 asiento');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Generate initial config and data based on type
            let config: any = {};
            let data: any = {};

            if (type === 'hemiciclo') {
                const layout = calculateDefaultLayout(seatCount);

                // Include data source if dataset is selected
                const dataSource: HemicicloDataSource | undefined = selectedDatasetId ? {
                    type: 'dataset',
                    datasetIds: [selectedDatasetId],
                    columnMappings: {}
                } : undefined;

                config = { layout, dataSource };

                // Use mock data if admin selected it
                if (useMockData && isAdmin) {
                    const mockData = generateRandomHemicicloData(seatCount);
                    // Convert mock format to new format
                    data = {
                        categories: mockData.parties.map((party, i) => ({
                            id: party.id,
                            name: party.name,
                            color: party.color,
                            order: i + 1,
                            seatCount: party.count
                        })),
                        seats: mockData.seats.map((seat, i) => ({
                            id: seat.id,
                            row: Math.floor(i / 20),
                            position: i % 20,
                            categoryId: mockData.parties.find(p => p.name.toUpperCase().includes(seat.party.replace('-', ' ')))?.id,
                            type: 'regular' as const,
                            actorData: seat.party !== 'VACANT' ? {
                                name: seat.label
                            } : undefined
                        }))
                    };
                } else {
                    const seats = generateEmptySeats(layout);
                    data = { categories: [], seats };
                }
            }

            const newMapping = await mappingsService.createMapping({
                project_id: projectId,
                name: name.trim(),
                description: description.trim() || undefined,
                type,
                config,
                data
            });

            onCreated(newMapping);
            onClose();
        } catch (err) {
            console.error('Error creating mapping:', err);
            setError(err instanceof Error ? err.message : 'Error al crear el mapeo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: 3
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiMap size={24} />
                    <Typography variant="h6">Crear Nuevo Mapeo</Typography>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Name field */}
                        <TextField
                            label="Nombre del Mapeo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            autoFocus
                            placeholder="Ej: Congreso 2024"
                            helperText="Nombre descriptivo para identificar este mapeo"
                        />

                        {/* Description field */}
                        <TextField
                            label="Descripción"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Describe el propósito de este mapeo..."
                            helperText="Opcional"
                        />

                        {/* Type selection */}
                        <FormControl component="fieldset">
                            <FormLabel component="legend" sx={{ mb: 1 }}>
                                Tipo de Mapeo
                            </FormLabel>
                            <RadioGroup
                                value={type}
                                onChange={(e) => setType(e.target.value as MappingType)}
                            >
                                <FormControlLabel
                                    value="hemiciclo"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body1" fontWeight="medium">
                                                Hemiciclo
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Visualización de asientos en formato semicircular
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{
                                        border: '1px solid',
                                        borderColor: type === 'hemiciclo' ? 'primary.main' : 'divider',
                                        borderRadius: 1,
                                        p: 1.5,
                                        bgcolor: type === 'hemiciclo' ? 'primary.50' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                />
                            </RadioGroup>
                        </FormControl>

                        {/* Hemiciclo configuration */}
                        {type === 'hemiciclo' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Divider />

                                {/* Dataset selection */}
                                <FormControl fullWidth size="small">
                                    <InputLabel>Vincular Dataset (opcional)</InputLabel>
                                    <Select
                                        value={selectedDatasetId}
                                        onChange={(e) => setSelectedDatasetId(e.target.value)}
                                        label="Vincular Dataset (opcional)"
                                        disabled={loadingDatasets}
                                        startAdornment={selectedDatasetId ? <FiDatabase style={{ marginRight: 8 }} /> : undefined}
                                    >
                                        <MenuItem value="">
                                            <em>-- Sin dataset --</em>
                                        </MenuItem>
                                        {datasets.map(ds => (
                                            <MenuItem key={ds.id} value={ds.id}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                    <span>{ds.name}</span>
                                                    <Chip label={`${ds.row_count} filas`} size="small" sx={{ ml: 1 }} />
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Show message if dataset selected */}
                                {selectedDataset && (
                                    <Alert severity="info" icon={<FiDatabase />}>
                                        Dataset <strong>{selectedDataset.name}</strong> tiene {selectedDataset.row_count} filas.
                                        Puedes usar este número como cantidad de asientos.
                                    </Alert>
                                )}

                                {/* Seat source selection */}
                                {selectedDataset && (
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>
                                            Calcular asientos desde:
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            value={seatSource}
                                            onChange={(e) => handleSeatSourceChange(e.target.value as 'manual' | 'dataset')}
                                        >
                                            <FormControlLabel
                                                value="dataset"
                                                control={<Radio size="small" />}
                                                label={`Dataset (${selectedDataset.row_count})`}
                                            />
                                            <FormControlLabel
                                                value="manual"
                                                control={<Radio size="small" />}
                                                label="Manual"
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                )}

                                {/* Seat count */}
                                <Box>
                                    <Typography variant="body2" gutterBottom>
                                        Número de Asientos: <strong>{seatCount}</strong>
                                    </Typography>
                                    <Slider
                                        value={seatCount}
                                        onChange={(_, value) => {
                                            setSeatCount(value as number);
                                            if (seatSource === 'dataset') {
                                                setSeatSource('manual');
                                            }
                                        }}
                                        min={10}
                                        max={500}
                                        step={1}
                                        marks={[
                                            { value: 50, label: '50' },
                                            { value: 100, label: '100' },
                                            { value: 160, label: '160' },
                                            { value: 300, label: '300' },
                                            { value: 500, label: '500' }
                                        ]}
                                        valueLabelDisplay="auto"
                                        disabled={seatSource === 'dataset'}
                                    />
                                    <TextField
                                        type="number"
                                        value={seatCount}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 10;
                                            setSeatCount(Math.min(500, Math.max(10, val)));
                                            if (seatSource === 'dataset') {
                                                setSeatSource('manual');
                                            }
                                        }}
                                        size="small"
                                        sx={{ width: 100, mt: 1 }}
                                        inputProps={{ min: 10, max: 500 }}
                                        disabled={seatSource === 'dataset'}
                                    />
                                </Box>

                                {/* Admin-only mock data option */}
                                {isAdmin && (
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: 'warning.50',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'warning.light'
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={useMockData}
                                                    onChange={(e) => setUseMockData(e.target.checked)}
                                                    color="warning"
                                                />
                                            }
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <FiZap />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            Usar datos de prueba (Mock)
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Genera partidos y asignaciones aleatorias para previsualizar
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                        <Chip
                                            label="Solo Admin"
                                            size="small"
                                            color="warning"
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !name.trim()}
                        sx={{
                            bgcolor: 'success.main',
                            '&:hover': { bgcolor: 'success.dark' }
                        }}
                    >
                        {loading ? 'Creando...' : 'Crear Mapeo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateMappingModal;
