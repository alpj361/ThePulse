import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Divider,
    Button,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import { FiArrowLeft, FiEdit, FiShare2, FiDownload, FiClock, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import type { BaseMapping } from '../../types/mappings';
import HemicicloVisualization from './HemicicloVisualization';
import { mockHemicicloData } from './mockHemicicloData';

interface MappingDetailViewProps {
    mapping: BaseMapping;
    onBack: () => void;
    onEdit?: () => void;
}

const MappingDetailView: React.FC<MappingDetailViewProps> = ({
    mapping,
    onBack,
    onEdit
}) => {
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            hemiciclo: 'Hemiciclo Parlamentario'
        };
        return labels[type] || type;
    };

    const renderVisualization = () => {
        switch (mapping.type) {
            case 'hemiciclo':
                return (
                    <HemicicloVisualization
                        data={mapping.data?.seats ? mapping.data : mockHemicicloData}
                        width={800}
                        height={500}
                        interactive={true}
                    />
                );
            default:
                return (
                    <Box
                        sx={{
                            p: 8,
                            textAlign: 'center',
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '2px dashed',
                            borderColor: 'grey.300'
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Tipo de visualización no soportado: {mapping.type}
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconButton onClick={onBack} sx={{ mr: 1 }}>
                            <FiArrowLeft />
                        </IconButton>
                        <Typography variant="h4" sx={{ flex: 1, fontWeight: 700 }}>
                            {mapping.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<FiShare2 />}
                                size="small"
                            >
                                Compartir
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FiDownload />}
                                size="small"
                            >
                                Exportar
                            </Button>
                            {onEdit && (
                                <Button
                                    variant="contained"
                                    startIcon={<FiEdit />}
                                    onClick={onEdit}
                                    size="small"
                                >
                                    Editar
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Metadata */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item>
                            <Chip
                                label={getTypeLabel(mapping.type)}
                                color="primary"
                                sx={{ fontWeight: 500 }}
                            />
                        </Grid>
                        <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FiClock size={16} color="#666" />
                            <Typography variant="body2" color="text.secondary">
                                Creado: {formatDate(mapping.created_at)}
                            </Typography>
                        </Grid>
                        <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FiUser size={16} color="#666" />
                            <Typography variant="body2" color="text.secondary">
                                ID: {mapping.user_id}
                            </Typography>
                        </Grid>
                    </Grid>

                    {mapping.description && (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {mapping.description}
                        </Typography>
                    )}

                    <Divider />
                </Box>

                {/* Visualización Principal */}
                <Card elevation={3} sx={{ mb: 4 }}>
                    <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                        {renderVisualization()}
                    </CardContent>
                </Card>

                {/* Información Adicional */}
                <Grid container spacing={3}>
                    {/* Configuración */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Configuración
                                </Typography>
                                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                    <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                                        {JSON.stringify(mapping.config, null, 2)}
                                    </pre>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Estadísticas */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Estadísticas
                                </Typography>

                                {mapping.type === 'hemiciclo' && (
                                    <Box>
                                        {mapping.data?.parties ? (
                                            <Box sx={{ display: 'grid', gap: 1 }}>
                                                {mapping.data.parties.map((party: any, index: number) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            p: 1,
                                                            bgcolor: 'grey.50',
                                                            borderRadius: 1
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box
                                                                sx={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: '50%',
                                                                    bgcolor: party.color
                                                                }}
                                                            />
                                                            <Typography variant="body2">
                                                                {party.name}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {party.count} escaños
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No hay datos de partidos disponibles
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Última modificación: {formatDate(mapping.updated_at)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </motion.div>
    );
};

export default MappingDetailView;