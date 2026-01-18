import React from 'react';
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import { FiArrowLeft, FiShare2 } from 'react-icons/fi';
import { RelationshipGraph } from './RelationshipGraph';

interface RelationshipGraphDemoProps {
    onBack: () => void;
}

const RelationshipGraphDemo: React.FC<RelationshipGraphDemoProps> = ({ onBack }) => {
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
                        <FiShare2 />
                        Demo: Gráfico de Relaciones Interactivo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Red de relaciones entre actores tecnológicos con interacciones dinámicas
                    </Typography>
                </Box>
            </Box>

            {/* Demo Description */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🌐 Funcionalidades del Demo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Esta visualización interactiva muestra las relaciones entre líderes tecnológicos,
                        empresas, instituciones y grupos de oposición. Haz clic en cualquier nodo para
                        explorar sus conexiones y obtener información detallada.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🔵 Líderes Tecnológicos
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#7c3aed',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🟣 Corporaciones
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#0d9488',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🟢 Instituciones
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            ⚫ Independientes
                        </Typography>
                        <Typography variant="caption" sx={{
                            backgroundColor: '#b91c1c',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}>
                            🔴 Oposición
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Interactive Graph */}
            <Card elevation={6} sx={{
                borderRadius: 6,
                border: `4px solid ${theme.palette.primary.light}`,
                overflow: 'visible'
            }}>
                <CardContent sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <RelationshipGraph />
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
                            <li>Haz <strong>clic</strong> en cualquier nodo para seleccionarlo y ver sus conexiones</li>
                            <li>Pasa el <strong>mouse</strong> sobre un nodo para ver información preliminar</li>
                            <li>Los nodos conectados se <strong>destacan</strong> cuando seleccionas uno</li>
                            <li>El panel lateral muestra <strong>detalles</strong> del nodo seleccionado</li>
                            <li>Haz clic en las <strong>conexiones</strong> del panel para navegar entre nodos</li>
                        </ul>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RelationshipGraphDemo;