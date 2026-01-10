import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Paper,
    useTheme
} from '@mui/material';
import { FiInfo } from 'react-icons/fi';
import ParliamentSeat, { type PartyType } from './ParliamentSeat';

interface Seat {
    id: string;
    party: PartyType;
    row: number;
    position: number;
    memberName?: string;
}

interface LegendItemProps {
    party: PartyType;
    label: string;
    sublabel: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}

const partyColors: Record<PartyType, string> = {
    'far-left': '#991B1B',
    'center-left': '#EA580C',
    center: '#F59E0B',
    'center-right': '#3B82F6',
    right: '#1D4ED8',
    'far-right': '#1E3A8A',
    independent: '#6B7280',
    vacant: '#D1D5DB',
};

const LegendItem: React.FC<LegendItemProps> = ({
    party,
    label,
    sublabel,
    count,
    isActive,
    onClick
}) => {
    const theme = useTheme();

    return (
        <Button
            onClick={onClick}
            variant={isActive ? "contained" : "outlined"}
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                border: `2px solid ${isActive ? theme.palette.primary.main : '#e0e0e0'}`,
                backgroundColor: isActive ? theme.palette.primary.light : 'white',
                color: isActive ? 'white' : 'inherit',
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: theme.shadows[4],
                    backgroundColor: isActive ? theme.palette.primary.main : theme.palette.grey[50]
                },
                transition: 'all 0.2s ease'
            }}
        >
            <Box
                sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: partyColors[party],
                    border: '2px solid white',
                    flexShrink: 0,
                    boxShadow: 1
                }}
            />
            <Box sx={{ flex: 1, textAlign: 'left' }}>
                <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    display: 'block',
                    color: isActive ? 'inherit' : theme.palette.text.primary
                }}>
                    {label}
                </Typography>
                <Typography variant="caption" sx={{
                    color: isActive ? 'inherit' : theme.palette.text.secondary,
                    fontSize: '10px'
                }}>
                    {sublabel}
                </Typography>
            </Box>
            <Typography variant="h6" sx={{
                fontWeight: 'bold',
                color: isActive ? 'inherit' : theme.palette.text.primary
            }}>
                {count}
            </Typography>
        </Button>
    );
};

// Función para generar los escaños con distribución exacta de la referencia
function generateSeats(): Seat[] {
    const seats: Seat[] = [];
    let id = 1;

    // Configuración exacta del proyecto de referencia
    const rowConfigs = [
        {
            count: 22,
            distribution: [
                { party: 'independent' as PartyType, seats: 2 },
                { party: 'far-left' as PartyType, seats: 3 },
                { party: 'center-left' as PartyType, seats: 4 },
                { party: 'center' as PartyType, seats: 4 },
                { party: 'center-right' as PartyType, seats: 4 },
                { party: 'right' as PartyType, seats: 3 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 26,
            distribution: [
                { party: 'independent' as PartyType, seats: 2 },
                { party: 'far-left' as PartyType, seats: 4 },
                { party: 'center-left' as PartyType, seats: 5 },
                { party: 'center' as PartyType, seats: 5 },
                { party: 'center-right' as PartyType, seats: 5 },
                { party: 'right' as PartyType, seats: 3 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 30,
            distribution: [
                { party: 'independent' as PartyType, seats: 2 },
                { party: 'far-left' as PartyType, seats: 4 },
                { party: 'center-left' as PartyType, seats: 6 },
                { party: 'center' as PartyType, seats: 6 },
                { party: 'center-right' as PartyType, seats: 6 },
                { party: 'right' as PartyType, seats: 4 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 34,
            distribution: [
                { party: 'independent' as PartyType, seats: 3 },
                { party: 'far-left' as PartyType, seats: 5 },
                { party: 'center-left' as PartyType, seats: 6 },
                { party: 'center' as PartyType, seats: 7 },
                { party: 'center-right' as PartyType, seats: 7 },
                { party: 'right' as PartyType, seats: 4 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 38,
            distribution: [
                { party: 'independent' as PartyType, seats: 3 },
                { party: 'far-left' as PartyType, seats: 5 },
                { party: 'center-left' as PartyType, seats: 7 },
                { party: 'center' as PartyType, seats: 8 },
                { party: 'center-right' as PartyType, seats: 8 },
                { party: 'right' as PartyType, seats: 5 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 42,
            distribution: [
                { party: 'independent' as PartyType, seats: 4 },
                { party: 'far-left' as PartyType, seats: 6 },
                { party: 'center-left' as PartyType, seats: 8 },
                { party: 'center' as PartyType, seats: 9 },
                { party: 'center-right' as PartyType, seats: 9 },
                { party: 'right' as PartyType, seats: 4 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 46,
            distribution: [
                { party: 'independent' as PartyType, seats: 4 },
                { party: 'far-left' as PartyType, seats: 6 },
                { party: 'center-left' as PartyType, seats: 9 },
                { party: 'center' as PartyType, seats: 10 },
                { party: 'center-right' as PartyType, seats: 10 },
                { party: 'right' as PartyType, seats: 5 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
        {
            count: 50,
            distribution: [
                { party: 'independent' as PartyType, seats: 4 },
                { party: 'far-left' as PartyType, seats: 7 },
                { party: 'center-left' as PartyType, seats: 10 },
                { party: 'center' as PartyType, seats: 11 },
                { party: 'center-right' as PartyType, seats: 11 },
                { party: 'right' as PartyType, seats: 5 },
                { party: 'vacant' as PartyType, seats: 2 },
            ],
        },
    ];

    rowConfigs.forEach((config, rowIndex) => {
        let currentPosition = 0;
        config.distribution.forEach((block) => {
            for (let i = 0; i < block.seats; i++) {
                seats.push({
                    id: `seat-${id++}`,
                    party: block.party,
                    row: rowIndex,
                    position: currentPosition++,
                });
            }
        });
    });

    return seats;
}

// Función para calcular la posición exacta de cada escaño
function calculateSeatPosition(seat: Seat, totalInRow: number, radius: number): { x: number; y: number } {
    const centerX = 50;
    const centerY = 90; // Base near bottom to maximize space

    // Semicírculo amplio
    const angleSpan = 170; // Wider span
    const anglePerSeat = angleSpan / (totalInRow > 1 ? totalInRow - 1 : 1);
    const angle = 180 - ((180 - angleSpan) / 2 + seat.position * anglePerSeat);

    // Convert to radians
    const angleRad = (angle * Math.PI) / 180;

    // Aspect ratio correction:
    // Container is 2:1 (width:height).
    // 1 unit of X% = 1 unit of physical width.
    // 1 unit of Y% = 1 unit of physical height = 0.5 units of physical width.
    // To make a circle, Y-change percentage must be 2x the X-change percentage.
    const radiusX = radius;
    const radiusY = radius * 2; // Correction for 2:1 aspect ratio

    const x = centerX + radiusX * Math.cos(angleRad);
    const y = centerY - radiusY * Math.sin(angleRad);

    return { x, y };
}

const ProfessionalHemiciclo: React.FC = () => {
    const theme = useTheme();
    const seats = useMemo(() => generateSeats(), []);
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
    const [filterParty, setFilterParty] = useState<PartyType | null>(null);

    const toggleSeat = (seatId: string) => {
        setSelectedSeats((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(seatId)) {
                newSet.delete(seatId);
            } else {
                newSet.add(seatId);
            }
            return newSet;
        });
    };

    const togglePartyFilter = (party: PartyType) => {
        if (filterParty === party) {
            setFilterParty(null);
            setSelectedSeats(new Set());
        } else {
            setFilterParty(party);
            const partySeats = seats.filter((s) => s.party === party).map((s) => s.id);
            setSelectedSeats(new Set(partySeats));
        }
    };

    const partyCounts = useMemo(() => {
        const counts: Record<PartyType, number> = {
            'far-left': 0,
            'center-left': 0,
            center: 0,
            'center-right': 0,
            right: 0,
            'far-right': 0,
            independent: 0,
            vacant: 0,
        };
        seats.forEach((seat) => {
            counts[seat.party]++;
        });
        return counts;
    }, [seats]);

    // Configuración de radios optimizada para llenar el contenedor 2:1
    // Max visual radius (X) should be ~45% (to leave 5% margin).
    // Min visual radius should be ~15%.
    const rowConfigs = [
        { count: 22, radius: 15 },
        { count: 26, radius: 19 },
        { count: 30, radius: 23 },
        { count: 34, radius: 27 },
        { count: 38, radius: 31 },
        { count: 42, radius: 35 },
        { count: 46, radius: 39 },
        { count: 50, radius: 43 }, // Max X=43 -> Left=7%, Right=93%. Max Y (from 90) = 90 - 43*2 = 4%. Perfect usage.
    ];

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
                    Hemiciclo Parlamentario Profesional
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <FiInfo size={16} />
                    <Typography variant="body1" color="text.secondary">
                        Haz clic en los asientos para seleccionarlos o en los grupos políticos para filtrar
                    </Typography>
                </Box>
            </Box>

            {/* Hemiciclo Principal */}
            <Card elevation={6} sx={{
                borderRadius: 6,
                border: `4px solid ${theme.palette.primary.light}`,
                mb: 4
            }}>
                <CardContent sx={{ p: 6 }}>
                    {/* Contenedor del hemiciclo */}
                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        // Use a padding-bottom hack or aspectRatio for responsive height based on width
                        aspectRatio: '2/1', // Semi-circle ratio
                        mb: 4,
                        background: `linear-gradient(180deg, #f0f8ff 0%, #e6f3ff 100%)`, // Fondo azul claro como en tu imagen
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        overflow: 'hidden' // Para evitar que los escaños se salgan
                    }}>
                        {/* Renderizar todos los escaños */}
                        <AnimatePresence>
                            {rowConfigs.map((config, rowIndex) => {
                                const rowSeats = seats.filter((s) => s.row === rowIndex);
                                return rowSeats.map((seat) => (
                                    <ParliamentSeat
                                        key={seat.id}
                                        id={seat.id}
                                        party={seat.party}
                                        isSelected={selectedSeats.has(seat.id)}
                                        onClick={() => toggleSeat(seat.id)}
                                        position={calculateSeatPosition(seat, config.count, config.radius)}
                                        seatNumber={seat.id.split('-')[1]}
                                        memberName={seat.memberName}
                                    />
                                ));
                            })}
                        </AnimatePresence>

                        {/* Podio - más pequeño y posicionado como en tu imagen */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '88%', // Adjusted for new center
                                transform: 'translate(-50%, -50%)',
                                width: 100,
                                height: 50,
                                backgroundColor: '#5f6368', // Gris más parecido a tu imagen
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1 }}
                        >
                            🏛️
                        </motion.div>
                    </Box>

                    {/* Leyenda y controles */}
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        {[
                            { color: 'far-left', label: 'EXTREMA IZQ.', sub: 'Rojo Oscuro' },
                            { color: 'center-left', label: 'CENTRO IZQ.', sub: 'Naranja' },
                            { color: 'center', label: 'CENTRO', sub: 'Amarillo' },
                            { color: 'center-right', label: 'CENTRO DER.', sub: 'Azul Claro' },
                            { color: 'right', label: 'DERECHA', sub: 'Azul Real' },
                            { color: 'far-right', label: 'EXTREMA DER.', sub: 'Azul Marino' },
                            { color: 'independent', label: 'INDEPENDIENTE', sub: 'Gris Neutro' },
                            { color: 'vacant', label: 'VACANTE', sub: 'Gris Claro' }
                        ].map((item) => (
                            <Grid item xs={12} sm={6} md={3} key={item.color} sx={{ display: 'flex' }}>
                                <LegendItem
                                    party={item.color as PartyType}
                                    label={item.label}
                                    sublabel={item.sub}
                                    count={partyCounts[item.color as PartyType]}
                                    isActive={filterParty === item.color}
                                    onClick={() => togglePartyFilter(item.color as PartyType)}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    {/* Panel de estadísticas */}
                    <Paper elevation={2} sx={{
                        mt: 4,
                        p: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                        color: 'white'
                    }}>
                        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                                    {seats.length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Total Asientos
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                                    {selectedSeats.size}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Seleccionados
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                                    {selectedSeats.size > 0 ? Math.round((selectedSeats.size / seats.length) * 100) : 0}%
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Porcentaje
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ProfessionalHemiciclo;