import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { FiArrowLeft, FiEdit } from 'react-icons/fi';
import HemicicloSVG from './HemicicloSVG';
import CategoryLegend from './CategoryLegend';
import CustomFieldsDisplay from './CustomFieldsDisplay';
import { mappingsService } from '../../../services/mappings';
import type {
    HemicicloConfig,
    HemicicloData,
    HemicicloSeat
} from '../../../types/mappings';

interface HemicicloViewerProps {
    mappingId: string;
    onBack: () => void;
    onEdit?: () => void;
}

const HemicicloViewer: React.FC<HemicicloViewerProps> = ({
    mappingId,
    onBack,
    onEdit
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mappingName, setMappingName] = useState('');
    const [config, setConfig] = useState<HemicicloConfig | null>(null);
    const [data, setData] = useState<HemicicloData | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<HemicicloSeat | null>(null);

    useEffect(() => {
        const loadMapping = async () => {
            setLoading(true);
            try {
                const mapping = await mappingsService.getMappingById(mappingId);
                if (mapping) {
                    setMappingName(mapping.name);
                    setConfig(mapping.config as HemicicloConfig);
                    setData(mapping.data as HemicicloData);
                } else {
                    setError('Mapeo no encontrado');
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

    const handleSeatClick = (seat: HemicicloSeat) => {
        setSelectedSeat(seat);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<FiArrowLeft />} onClick={onBack} sx={{ mt: 2 }}>
                    Volver
                </Button>
            </Box>
        );
    }

    if (!config || !data) return null;

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
                </Box>
                {onEdit && (
                    <Button variant="outlined" startIcon={<FiEdit />} onClick={onEdit}>
                        Editar
                    </Button>
                )}
            </Box>

            {/* Main content */}
            <Paper sx={{ p: 3 }}>
                {/* Legend */}
                <Box sx={{ mb: 3 }}>
                    <CategoryLegend categories={data.categories} showCounts />
                </Box>

                {/* Hemiciclo */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <HemicicloSVG
                        layout={config.layout}
                        seats={data.seats}
                        categories={data.categories}
                        onSeatClick={handleSeatClick}
                        selectedSeatId={selectedSeat?.id}
                        width={700}
                        height={400}
                    />
                </Box>

                {/* Selected seat info */}
                {selectedSeat && (
                    <Paper
                        elevation={3}
                        sx={{
                            mt: 3,
                            p: 2,
                            bgcolor: 'primary.50',
                            borderLeft: '4px solid',
                            borderColor: 'primary.main'
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            {selectedSeat.actorData?.name || `Asiento ${selectedSeat.row}-${selectedSeat.position}`}
                        </Typography>
                        {selectedSeat.categoryId && (
                            <Typography variant="body2" color="text.secondary">
                                {data.categories.find(c => c.id === selectedSeat.categoryId)?.name}
                            </Typography>
                        )}
                        {selectedSeat.type !== 'regular' && (
                            <Typography variant="body2" color="primary">
                                {selectedSeat.type.charAt(0).toUpperCase() + selectedSeat.type.slice(1)}
                            </Typography>
                        )}
                        {/* Custom Fields Display */}
                        {selectedSeat.actorData?.metadata && config.dataSource?.customFields && (
                            <Box sx={{ mt: 2 }}>
                                <CustomFieldsDisplay
                                    customFields={config.dataSource.customFields}
                                    metadata={selectedSeat.actorData.metadata}
                                />
                            </Box>
                        )}
                    </Paper>
                )}
            </Paper>

            {/* Stats */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                        {config.layout.totalSeats}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total Asientos
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                        {data.seats.filter(s => s.actorData?.name).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Asignados
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h4" color="text.secondary">
                        {data.categories.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Categorías
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default HemicicloViewer;
