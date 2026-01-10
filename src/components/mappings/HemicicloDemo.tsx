import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    ButtonGroup,
    Divider,
    Grid,
    Paper,
    FormControlLabel,
    Switch,
    Slider,
    Alert,
    IconButton,
    Chip
} from '@mui/material';
import { FiRefreshCw, FiDownload, FiSettings, FiBarChart, FiArrowLeft } from 'react-icons/fi';
import HemicicloVisualization from './HemicicloVisualization';
import ProfessionalHemiciclo from './ProfessionalHemiciclo';
// Para usar la función de generación de posiciones en la referencia
const generateHemicicloPositions = (totalSeats: number, width: number, height: number) => {
    const seats = [];
    const centerX = width / 2;
    const centerY = height * 0.9;
    const seatsPerRow = [
        { count: 13, radius: 120 },
        { count: 15, radius: 145 },
        { count: 17, radius: 170 },
        { count: 19, radius: 195 },
        { count: 21, radius: 220 },
        { count: 23, radius: 245 },
        { count: 25, radius: 270 },
        { count: 27, radius: 295 }
    ];

    let seatId = 1;
    for (let row = 0; row < Math.min(8, seatsPerRow.length); row++) {
        const { count: seatsInRow, radius } = seatsPerRow[row];
        const angleRange = Math.PI * 0.9;
        const startAngle = Math.PI * 0.05;
        const angleStep = angleRange / (seatsInRow - 1);

        for (let seat = 0; seat < seatsInRow; seat++) {
            if (seatId <= totalSeats) {
                const angle = startAngle + (seat * angleStep);
                const x = centerX + Math.cos(angle) * (radius * 0.6); // Escalar para vista de referencia
                const y = centerY - Math.sin(angle) * (radius * 0.6);
                seats.push({ x, y });
                seatId++;
            }
        }
    }
    return seats;
};
import {
    mockHemicicloData,
    smallHemicicloData,
    generateRandomHemicicloData
} from './mockHemicicloData';
import type { HemicicloData } from '../../types/mappings';

interface HemicicloDemoProps {
    onBack?: () => void;
}

const HemicicloDemo: React.FC<HemicicloDemoProps> = ({ onBack }) => {
    const [currentData, setCurrentData] = useState<HemicicloData>(smallHemicicloData);
    const [interactive, setInteractive] = useState(true);
    const [totalSeats, setTotalSeats] = useState(50);
    const [viewMode, setViewMode] = useState<'basic' | 'professional'>('professional');

    const handleDatasetChange = (dataType: 'small' | 'full' | 'random') => {
        switch (dataType) {
            case 'small':
                setCurrentData(smallHemicicloData);
                setTotalSeats(50);
                break;
            case 'full':
                setCurrentData(mockHemicicloData);
                setTotalSeats(350);
                break;
            case 'random':
                const randomData = generateRandomHemicicloData(totalSeats);
                setCurrentData(randomData);
                break;
        }
    };

    const generateCustomData = () => {
        const customData = generateRandomHemicicloData(totalSeats);
        setCurrentData(customData);
    };

    const totalAssignedSeats = currentData.seats.filter(seat => seat.party !== 'VACANT').length;
    const vacantSeats = currentData.seats.length - totalAssignedSeats;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {onBack && (
                        <IconButton onClick={onBack} sx={{ mr: 2 }}>
                            <FiArrowLeft />
                        </IconButton>
                    )}
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        Hemiciclo Parlamentario Interactivo
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Button
                        variant={viewMode === 'professional' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('professional')}
                        color="primary"
                        size="large"
                    >
                        🏛️ Versión Profesional
                    </Button>
                    <Button
                        variant={viewMode === 'basic' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('basic')}
                        color="secondary"
                        size="large"
                    >
                        🎯 Versión Básica
                    </Button>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Visualización interactiva de la composición parlamentaria con datos en tiempo real
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Funcionalidades interactivas:</strong> Haz clic en los partidos para filtrar,
                    pasa el cursor sobre los escaños para ver detalles, y usa los controles para cambiar
                    la configuración.
                </Alert>
            </Box>

            {/* Versión Profesional */}
            {viewMode === 'professional' && (
                <ProfessionalHemiciclo />
            )}

            {/* Versión Básica */}
            {viewMode === 'basic' && (
                <Grid container spacing={4}>
                    {/* Panel de Control */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiSettings />
                                    Panel de Control
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {/* Datasets predefinidos */}
                                <Typography variant="subtitle2" gutterBottom>
                                    Datasets de Ejemplo:
                                </Typography>
                                <ButtonGroup fullWidth orientation="vertical" sx={{ mb: 3 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleDatasetChange('small')}
                                        startIcon={<FiBarChart />}
                                    >
                                        Ejemplo Pequeño (50 escaños)
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleDatasetChange('full')}
                                        startIcon={<FiBarChart />}
                                    >
                                        Congreso Español (350 escaños)
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleDatasetChange('random')}
                                        startIcon={<FiRefreshCw />}
                                        color="success"
                                    >
                                        Generar Aleatorio
                                    </Button>
                                </ButtonGroup>

                                {/* Configuración personalizada */}
                                <Typography variant="subtitle2" gutterBottom>
                                    Configuración Personalizada:
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        Total de Escaños: {totalSeats}
                                    </Typography>
                                    <Slider
                                        value={totalSeats}
                                        onChange={(_, value) => setTotalSeats(value as number)}
                                        min={20}
                                        max={500}
                                        step={10}
                                        marks={[
                                            { value: 50, label: '50' },
                                            { value: 200, label: '200' },
                                            { value: 350, label: '350' },
                                            { value: 500, label: '500' }
                                        ]}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={generateCustomData}
                                    startIcon={<FiRefreshCw />}
                                    sx={{ mb: 2 }}
                                >
                                    Aplicar Configuración
                                </Button>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={interactive}
                                            onChange={(e) => setInteractive(e.target.checked)}
                                        />
                                    }
                                    label="Modo Interactivo"
                                    sx={{ mb: 2 }}
                                />

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<FiDownload />}
                                    disabled
                                    sx={{ opacity: 0.5 }}
                                >
                                    Exportar Imagen (Próximamente)
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Estadísticas */}
                        <Card elevation={2} sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Estadísticas Generales
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary.main">
                                            {currentData.seats.length}
                                        </Typography>
                                        <Typography variant="caption">
                                            Total Escaños
                                        </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {totalAssignedSeats}
                                        </Typography>
                                        <Typography variant="caption">
                                            Ocupados
                                        </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="warning.main">
                                            {vacantSeats}
                                        </Typography>
                                        <Typography variant="caption">
                                            Vacantes
                                        </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="info.main">
                                            {currentData.parties.filter(p => p.count > 0).length}
                                        </Typography>
                                        <Typography variant="caption">
                                            Partidos
                                        </Typography>
                                    </Paper>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Visualización Principal */}
                    <Grid item xs={12} md={8}>
                        {/* Imagen de referencia */}
                        <Card elevation={2} sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📐 Imagen de Referencia Original
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 2,
                                    border: '2px solid #e0e0e0'
                                }}>
                                    <Box sx={{
                                        width: 600,
                                        height: 400,
                                        background: 'linear-gradient(180deg, #f0f8ff 0%, #e6f3ff 100%)',
                                        borderRadius: 2,
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #ccc'
                                    }}>
                                        <svg width={600} height={400} viewBox="0 0 600 400">
                                            {/* Fondo del hemiciclo de referencia */}
                                            <ellipse
                                                cx={300}
                                                cy={360}
                                                rx={280}
                                                ry={140}
                                                fill="none"
                                                stroke="#ddd"
                                                strokeWidth={2}
                                                strokeDasharray="5,5"
                                            />

                                            {/* Mesa presidencial */}
                                            <rect x={270} y={350} width={60} height={25} rx={8} fill="#1976d2" opacity={0.8} />
                                            <rect x={285} y={355} width={30} height={15} rx={4} fill="#1565c0" />

                                            {/* Números de filas */}
                                            <g fill="#666" fontSize="12" textAnchor="middle">
                                                <text x={90} y={320}>8</text>
                                                <text x={120} y={300}>7</text>
                                                <text x={145} y={280}>6</text>
                                                <text x={170} y={260}>5</text>
                                                <text x={195} y={240}>4</text>
                                                <text x={220} y={220}>3</text>
                                                <text x={245} y={200}>2</text>
                                                <text x={270} y={180}>1</text>

                                                <text x={510} y={320}>8</text>
                                                <text x={480} y={300}>7</text>
                                                <text x={455} y={280}>6</text>
                                                <text x={430} y={260}>5</text>
                                                <text x={405} y={240}>4</text>
                                                <text x={380} y={220}>3</text>
                                                <text x={355} y={200}>2</text>
                                                <text x={330} y={180}>1</text>
                                            </g>

                                            {/* Simulación de escaños con colores de referencia */}
                                            {generateHemicicloPositions(160, 600, 400).slice(0, 160).map((seat, i) => (
                                                <circle
                                                    key={i}
                                                    cx={seat.x}
                                                    cy={seat.y}
                                                    r={4}
                                                    fill={
                                                        i < 20 ? '#8B0000' :      // FAR-LEFT
                                                            i < 80 ? '#FF8C42' :      // CENTER-LEFT
                                                                i < 100 ? '#FFD700' :     // CENTER
                                                                    i < 130 ? '#87CEEB' :     // CENTER-RIGHT
                                                                        i < 150 ? '#4169E1' :     // RIGHT
                                                                            '#808080'                  // INDEPENDENT
                                                    }
                                                    stroke="#333"
                                                    strokeWidth={0.5}
                                                    opacity={0.9}
                                                />
                                            ))}
                                        </svg>

                                        <Box sx={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            p: 1,
                                            borderRadius: 1,
                                            fontSize: '12px'
                                        }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Diseño basado en tu imagen de referencia
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Hemiciclo Interactivo */}
                        <Card elevation={3}>
                            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    ⚡ Hemiciclo Interactivo
                                    <Chip label="Implementación Funcional" size="small" color="success" />
                                </Typography>
                                <HemicicloVisualization
                                    data={currentData}
                                    width={900}
                                    height={550}
                                    interactive={interactive}
                                />
                            </CardContent>
                        </Card>

                        {/* Información adicional */}
                        <Card elevation={2} sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Cómo Usar la Visualización
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            🖱️ Interacciones:
                                        </Typography>
                                        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                                            <li>Haz clic en los chips de partidos para filtrar</li>
                                            <li>Pasa el cursor sobre escaños para ver detalles</li>
                                            <li>Los escaños se animan al cargar</li>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            🎨 Códigos de Color:
                                        </Typography>
                                        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                                            <li>Rojo Oscuro: Extrema Izquierda</li>
                                            <li>Naranja: Centro Izquierda</li>
                                            <li>Amarillo: Centro</li>
                                            <li>Azul Claro: Centro Derecha</li>
                                            <li>Azul Oscuro: Derecha</li>
                                            <li>Gris: Independientes/Vacantes</li>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default HemicicloDemo;