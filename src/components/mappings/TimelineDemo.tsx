import React from 'react';
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import { FiArrowLeft, FiClock } from 'react-icons/fi';
import { InteractiveTimeline } from './InteractiveTimeline';

interface TimelineDemoProps {
    onBack: () => void;
}

const TimelineDemo: React.FC<TimelineDemoProps> = ({ onBack }) => {
    const theme = useTheme();

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Button
                    startIcon={<FiArrowLeft />}
                    onClick={onBack}
                    variant="outlined"
                >
                    Volver a Mapeos
                </Button>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FiClock />
                        Demo: Timeline Interactivo de Eventos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Línea de tiempo cronológica con eventos históricos organizados por categorías
                    </Typography>
                </Box>
            </Box>

            {/* Demo Description */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📅 Funcionalidades del Timeline
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Este timeline interactivo muestra eventos históricos organizados cronológicamente.
                        Navega entre años, explora eventos por categorías y expande múltiples eventos
                        simultáneamente para obtener información detallada.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🔵 Político - Gobierno y Política
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#a855f7',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🟣 Social - Cultura y Sociedad
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#22c55e',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🟢 Económico - Mercados y Comercio
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🔴 Crisis - Conflictos y Desastres
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Interactive Timeline */}
            <Card elevation={6} sx={{
                borderRadius: 6,
                border: `4px solid ${theme.palette.primary.light}`,
                overflow: 'visible'
            }}>
                <CardContent sx={{ p: 4 }}>
                    <InteractiveTimeline />
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card sx={{ mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📋 Instrucciones de Uso
                    </Typography>
                    <Typography variant="body2" component="div">
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                            <li>Usa las <strong>flechas</strong> para navegar entre años diferentes</li>
                            <li>Haz <strong>clic</strong> en los botones de año para saltar directamente</li>
                            <li>Pasa el <strong>mouse</strong> sobre círculos para ver información rápida</li>
                            <li>Haz <strong>clic</strong> en círculos para expandir detalles completos del evento</li>
                            <li>Puedes expandir <strong>múltiples eventos</strong> simultáneamente</li>
                            <li>Los eventos se organizan alternativamente <strong>arriba y abajo</strong> del timeline</li>
                        </ul>
                    </Typography>
                </CardContent>
            </Card>

            {/* Technical Features */}
            <Card sx={{ mt: 3, bgcolor: 'background.default' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ Características Técnicas
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                🎯 Navegación Intuitiva
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Controles de año con indicadores de progreso y navegación fluida
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                🎨 Visualización Dinámica
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Timeline colorido con curvas SVG y animaciones suaves
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                📱 Diseño Responsivo
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Adaptable a diferentes tamaños de pantalla y dispositivos
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                🔍 Interactividad Avanzada
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tooltips, expansión de eventos y navegación por categorías
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default TimelineDemo;