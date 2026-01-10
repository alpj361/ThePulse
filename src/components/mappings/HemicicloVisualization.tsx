import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Typography,
    Tooltip,
    Chip,
    useTheme,
    alpha
} from '@mui/material';
import type { HemicicloData, HemicicloSeat } from '../../types/mappings';

interface HemicicloVisualizationProps {
    data: HemicicloData;
    width?: number;
    height?: number;
    interactive?: boolean;
}

interface SeatPosition extends HemicicloSeat {
    x: number;
    y: number;
    row: number;
    seatInRow: number;
}

const generateHemicicloPositions = (
    totalSeats: number,
    width: number,
    height: number
): SeatPosition[] => {
    const seats: SeatPosition[] = [];
    const centerX = width / 2;
    // Move center slightly up to allow more space for the frame at bottom
    const centerY = height * 0.85;
    const rows = 8;

    // More spaced out radii
    const seatsPerRow = [
        { count: 13, radius: 130 },  // Increased spacing
        { count: 15, radius: 160 },
        { count: 17, radius: 190 },
        { count: 19, radius: 220 },
        { count: 21, radius: 250 },
        { count: 23, radius: 280 },
        { count: 25, radius: 310 },
        { count: 27, radius: 340 }
    ];

    let seatId = 1;

    for (let row = 0; row < Math.min(rows, seatsPerRow.length); row++) {
        const { count: seatsInRow, radius } = seatsPerRow[row];

        // Slightly wider angle range to separate dots horizontally
        const angleRange = Math.PI * 0.95;
        const startAngle = (Math.PI - angleRange) / 2;
        const angleStep = angleRange / (seatsInRow > 1 ? seatsInRow - 1 : 1);

        for (let seat = 0; seat < seatsInRow; seat++) {
            if (seatId <= totalSeats) {
                // Calculate angle: 0 is right, PI is left. 
                // We want to go from right to left or left to right? 
                // Math.cos(angle) needs standard polar coords.
                // Usually Hemiciclo is from PI (left) to 0 (right), or similar.
                // For top semi-circle: angles 0 to PI.
                // Let's stick to the previous logic but ensure it's centered.

                // Previous logic: startAngle ~ 0.05PI.
                // Let's center it around PI/2 (top). 
                // If angleRange is 0.95PI, it goes from PI/2 + 0.95PI/2 to PI/2 - 0.95PI/2?
                // Actually, let's just use standard polar: 
                // Left is PI, Right is 0. Top is PI/2.
                // We want to distribute from approx PI (left) to 0 (right).

                const currentAngle = (Math.PI - startAngle) - (seat * angleStep);

                const x = centerX + Math.cos(currentAngle) * radius;
                const y = centerY - Math.sin(currentAngle) * radius;

                seats.push({
                    id: seatId.toString(),
                    position: { x, y },
                    x,
                    y,
                    row,
                    seatInRow: seat
                });
                seatId++;
            }
        }
    }

    return seats;
};

const PARTY_COLORS = {
    'FAR-LEFT': '#8B0000', // Deep Red
    'CENTER-LEFT': '#FF8C42', // Warm Orange
    'CENTER': '#FFD700', // Amber Yellow
    'CENTER-RIGHT': '#87CEEB', // Sky Blue
    'RIGHT': '#4169E1', // Royal Blue
    'FAR-RIGHT': '#191970', // Navy Blue
    'INDEPENDENT': '#808080', // Neutral Gray
    'VACANT': '#D3D3D3' // Light Gray
};

const PARTY_LABELS = {
    'FAR-LEFT': 'Extrema Izquierda',
    'CENTER-LEFT': 'Centro Izquierda',
    'CENTER': 'Centro',
    'CENTER-RIGHT': 'Centro Derecha',
    'RIGHT': 'Derecha',
    'FAR-RIGHT': 'Extrema Derecha',
    'INDEPENDENT': 'Independiente',
    'VACANT': 'Vacante'
};

const HemicicloVisualization: React.FC<HemicicloVisualizationProps> = ({
    data,
    width = 900, // Used for internal coordinate system (viewBox)
    height = 550,
    interactive = true
}) => {
    const theme = useTheme();
    const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
    const [selectedParty, setSelectedParty] = useState<string | null>(null);

    // Use width/height props as the definitions for the coordinate system
    const seatPositions = useMemo(() =>
        generateHemicicloPositions(data.seats.length, width, height),
        [data.seats.length, width, height]
    );

    const enhancedSeats = useMemo(() => {
        return seatPositions.map((position, index) => {
            const seat = data.seats[index] || { id: position.id };
            return {
                ...position,
                ...seat,
                party: seat.party || 'VACANT'
            };
        });
    }, [seatPositions, data.seats]);

    const partyStats = useMemo(() => {
        const stats = enhancedSeats.reduce((acc, seat) => {
            const party = seat.party || 'VACANT';
            acc[party] = (acc[party] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(stats).map(([party, count]) => ({
            party,
            count,
            percentage: (count / enhancedSeats.length * 100).toFixed(1)
        }));
    }, [enhancedSeats]);

    const handleSeatClick = (seat: SeatPosition) => {
        if (interactive && seat.party) {
            setSelectedParty(selectedParty === seat.party ? null : seat.party);
        }
    };

    const renderPodium = () => (
        <g>
            {/* Mesa presidencial */}
            <rect
                x={width / 2 - 40}
                y={height * 0.83}
                width={80}
                height={30}
                rx={4}
                fill={theme.palette.grey[700]}
                stroke={theme.palette.grey[800]}
            />
            {/* Icono podium */}
            <rect
                x={width / 2 - 15}
                y={height * 0.81}
                width={30}
                height={20}
                rx={2}
                fill={theme.palette.grey[800]}
            />
            {/* Microfono stem */}
            <line
                x1={width / 2}
                y1={height * 0.81}
                x2={width / 2}
                y2={height * 0.80}
                stroke={theme.palette.grey[900]}
                strokeWidth={2}
            />
        </g>
    );

    return (
        <Box>
            {/* Leyenda de partidos compacta */}
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {Object.entries(PARTY_COLORS).map(([party, color]) => {
                    const stat = partyStats.find(s => s.party === party);
                    if (!stat || stat.count === 0) return null;

                    return (
                        <Chip
                            key={party}
                            label={`${PARTY_LABELS[party as keyof typeof PARTY_LABELS]} (${stat.count})`}
                            size="small"
                            sx={{
                                bgcolor: selectedParty === party ? color : 'transparent',
                                color: selectedParty === party ? 'white' : theme.palette.text.primary,
                                border: `1px solid ${color}`,
                                fontWeight: selectedParty === party ? 'bold' : 'normal',
                                cursor: interactive ? 'pointer' : 'default',
                                '&:hover': interactive ? {
                                    bgcolor: alpha(color, 0.1)
                                } : {}
                            }}
                            onClick={() => interactive && setSelectedParty(
                                selectedParty === party ? null : party
                            )}
                        />
                    );
                })}
            </Box>

            {/* Hemiciclo SVG con Marco */}
            <Box sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                p: 3,
                bgcolor: '#f8f9fa', // Light background for contrast
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #e9ecef',
                width: '100%',
                // Responsive container
            }}>
                {/* Marco decorativo externo (simulado con borde del Box) */}

                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '600px', // Prevent too tall
                        overflow: 'visible'
                    }}
                >
                    {/* Marco interno sutil */}
                    <path
                        d={`M ${width * 0.05} ${height * 0.95} 
                           L ${width * 0.05} ${height * 0.1} 
                           Q ${width * 0.05} ${height * 0.05} ${width * 0.1} ${height * 0.05}
                           L ${width * 0.9} ${height * 0.05}
                           Q ${width * 0.95} ${height * 0.05} ${width * 0.95} ${height * 0.1}
                           L ${width * 0.95} ${height * 0.95}`}
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth={2}
                        strokeDasharray="10,5"
                        opacity={0.5}
                    />

                    {/* Arcos de fondo sutiles para guiar la vista */}
                    {[130, 220, 310].map((r, i) => (
                        <path
                            key={i}
                            d={`M ${width / 2 - r} ${height * 0.85} A ${r} ${r} 0 0 1 ${width / 2 + r} ${height * 0.85}`}
                            fill="none"
                            stroke="#e0e0e0"
                            strokeWidth={1}
                            strokeDasharray="4,4"
                        />
                    ))}

                    {/* Mesa presidencial */}
                    {renderPodium()}

                    {/* Asientos */}
                    <AnimatePresence>
                        {enhancedSeats.map((seat, index) => {
                            const isHighlighted = selectedParty ? seat.party === selectedParty : false;
                            const isHovered = hoveredSeat === seat.id;
                            const seatColor = PARTY_COLORS[seat.party as keyof typeof PARTY_COLORS] || PARTY_COLORS.VACANT;

                            return (
                                <Tooltip
                                    key={seat.id}
                                    title={
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                                {PARTY_LABELS[seat.party as keyof typeof PARTY_LABELS] || 'Sin asignar'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                Escaño {seat.id}
                                            </Typography>
                                        </Box>
                                    }
                                    placement="top"
                                    arrow
                                >
                                    <motion.circle
                                        cx={seat.x}
                                        cy={seat.y}
                                        r={isHovered ? 7 : 5.5} // Slightly smaller default radius
                                        fill={selectedParty && !isHighlighted ?
                                            alpha(seatColor, 0.2) : seatColor}
                                        stroke={isHovered ? theme.palette.common.white : 'none'}
                                        strokeWidth={isHovered ? 2 : 0}
                                        style={{
                                            cursor: interactive ? 'pointer' : 'default',
                                            filter: isHovered ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' : 'none'
                                        }}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{
                                            scale: 1,
                                            opacity: selectedParty && !isHighlighted ? 0.3 : 1
                                        }}
                                        transition={{
                                            delay: index * 0.005, // Faster animation
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 25
                                        }}
                                        whileHover={interactive ? { scale: 1.2 } : {}}
                                        onMouseEnter={() => interactive && setHoveredSeat(seat.id)}
                                        onMouseLeave={() => interactive && setHoveredSeat(null)}
                                        onClick={() => handleSeatClick(seat)}
                                    />
                                </Tooltip>
                            );
                        })}
                    </AnimatePresence>
                </svg>
            </Box>
        </Box>
    );
};

export default HemicicloVisualization;