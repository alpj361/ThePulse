import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, useTheme, Paper, IconButton, Grid, Tooltip, getContrastRatio, Button } from '@mui/material';
import { FiTrash2, FiX } from 'react-icons/fi';
import type { HemicicloSeat, HemicicloCategory, HemicicloLayout } from '../../../types/mappings';

interface HemicicloSVGProps {
    layout: HemicicloLayout;
    seats: HemicicloSeat[];
    categories: HemicicloCategory[];
    onSeatClick?: (seat: HemicicloSeat) => void;
    onBackgroundClick?: () => void;
    onAssignSeat?: (seat: HemicicloSeat, categoryId: string) => void;
    onClearSeat?: (seat: HemicicloSeat) => void;
    selectedSeatId?: string;
    selectedCategoryId?: string;
    width?: number;
    height?: number;
    editable?: boolean;
}

const HemicicloSVG: React.FC<HemicicloSVGProps> = ({
    layout,
    seats,
    categories,
    onSeatClick,
    onBackgroundClick,
    onAssignSeat,
    onClearSeat,
    selectedSeatId,
    selectedCategoryId,
    width = 800,
    height = 450,
    editable = false
}) => {
    const theme = useTheme();
    const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);

    // Get category details
    const getCategoryDetails = (categoryId?: string) => {
        if (!categoryId) return null;
        return categories.find(c => c.id === categoryId);
    };

    // Get color styles for a seat
    const getSeatStyles = (categoryId?: string) => {
        const category = getCategoryDetails(categoryId);
        const baseColor = category?.color || '#e0e0e0';
        return {
            bg: baseColor,
            hover: adjustColor(baseColor, 20),
            border: category ? adjustColor(baseColor, -30) : '#bbb'
        };
    };

    // Adjust color brightness
    const adjustColor = (hex: string, amount: number): string => {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    };

    // Calculate seat positions
    const positionedSeats = useMemo(() => {
        const centerX = 50;
        const centerY = 92;
        const minRadius = 12;
        const maxRadius = 44;
        const seatsPerRow = layout.seatsPerRow || [];
        const rows = layout.rows;
        const radiusStep = (maxRadius - minRadius) / (rows - 1 || 1);

        return seats.map((seat, globalIndex) => {
            let cumulative = 0;
            let rowIndex = 0;
            let positionInRow = 0;
            let seatsInThisRow = seatsPerRow[0] || 20;

            for (let r = 0; r < seatsPerRow.length; r++) {
                if (globalIndex < cumulative + seatsPerRow[r]) {
                    rowIndex = r;
                    positionInRow = globalIndex - cumulative;
                    seatsInThisRow = seatsPerRow[r];
                    break;
                }
                cumulative += seatsPerRow[r];
            }

            const radius = minRadius + rowIndex * radiusStep;
            const angleSpan = 170;
            const anglePerSeat = angleSpan / (seatsInThisRow > 1 ? seatsInThisRow - 1 : 1);
            const angle = 180 - ((180 - angleSpan) / 2 + positionInRow * anglePerSeat);
            const angleRad = (angle * Math.PI) / 180;

            // Correct aspect ratio (2:1)
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY - (radius * 2) * Math.sin(angleRad);

            return { ...seat, x, y, rowIndex, globalIndex };
        });
    }, [seats, layout]);

    const selectedSeat = positionedSeats.find(s => s.id === selectedSeatId);

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                maxWidth: width,
                height: 'auto',
                aspectRatio: '2/1',
                background: `linear-gradient(180deg, #f0f8ff 0%, #e6f3ff 100%)`,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'visible',
                mx: 'auto'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onBackgroundClick?.();
                }
            }}
        >
            <AnimatePresence>
                {positionedSeats.map((seat) => {
                    const styles = getSeatStyles(seat.categoryId);
                    const isSelected = seat.id === selectedSeatId;
                    const isHovered = seat.id === hoveredSeatId;
                    const isAssignable = editable && selectedCategoryId && !seat.categoryId;

                    return (
                        <motion.div
                            key={seat.id}
                            style={{
                                position: 'absolute',
                                left: `${seat.x}%`,
                                top: `${seat.y}%`,
                                transform: 'translate(-50%, -50%)',
                                cursor: onSeatClick ? 'pointer' : 'default',
                                zIndex: isHovered ? 20 : isSelected ? 10 : 1
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: seat.globalIndex * 0.003,
                                type: 'spring'
                            }}
                            whileHover={{ scale: 1.6, zIndex: 30 }}
                            whileTap={{ scale: 1.3 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSeatClick?.(seat);
                            }}
                            onMouseEnter={() => setHoveredSeatId(seat.id)}
                            onMouseLeave={() => setHoveredSeatId(null)}
                        >
                            <div
                                style={{
                                    width: width >= 1200 ? 16 : 12,
                                    height: width >= 1200 ? 16 : 12,
                                    borderRadius: '50%',
                                    backgroundColor: isHovered ? styles.hover : styles.bg,
                                    border: isSelected
                                        ? '3px solid #1976d2'
                                        : isAssignable
                                            ? `2px dashed ${selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.color : '#666'}`
                                            : `2px solid ${styles.border}`,
                                    boxShadow: isSelected
                                        ? '0 0 12px rgba(25,118,210,0.7), 0 0 20px rgba(25,118,210,0.4)'
                                        : isHovered
                                            ? '0 6px 16px rgba(0,0,0,0.35)'
                                            : '0 2px 4px rgba(0,0,0,0.15)',
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {seat.actorData?.name && (
                                    <span style={{
                                        fontSize: width >= 1200 ? 9 : 7,
                                        fontWeight: 'bold',
                                        color: getContrastRatio(styles.bg, '#fff') > 3 ? '#fff' : '#000',
                                        userSelect: 'none'
                                    }}>
                                        {seat.actorData.name.charAt(0)}
                                    </span>
                                )}
                            </div>

                            {/* Hover Tooltip (Only if NOT selected) */}
                            {isHovered && !isSelected && (
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        marginBottom: 8,
                                        padding: '6px 10px',
                                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                                        color: 'white',
                                        fontSize: 12,
                                        borderRadius: 6,
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none',
                                        zIndex: 100
                                    }}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div style={{ fontWeight: 'bold' }}>
                                        {seat.actorData?.name || `Asiento ${seat.row + 1}-${seat.position + 1}`}
                                    </div>
                                    <div style={{ fontSize: 10, opacity: 0.8 }}>
                                        {getCategoryDetails(seat.categoryId)?.name || 'Sin asignar'}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        borderLeft: '5px solid transparent',
                                        borderRight: '5px solid transparent',
                                        borderTop: '5px solid rgba(31, 41, 55, 0.95)'
                                    }} />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Selected Seat Action Menu - Disabled when using sidebar */}
            <AnimatePresence>
                {false && selectedSeat && editable && !selectedCategoryId && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: `${selectedSeat.x}%`,
                            top: `${selectedSeat.y}%`,
                            transform: 'translate(-50%, -100%)',
                            marginTop: -20,
                            zIndex: 50
                        }}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Paper
                            elevation={8}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                minWidth: 280,
                                bgcolor: 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(12px)',
                                border: '2px solid',
                                borderColor: selectedSeat.categoryId
                                    ? getCategoryDetails(selectedSeat.categoryId)?.color
                                    : 'divider',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 0.5 }}>
                                        {selectedSeat.actorData?.name || `Asiento ${selectedSeat.row + 1}-${selectedSeat.position + 1}`}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {selectedSeat.categoryId && (
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    bgcolor: getCategoryDetails(selectedSeat.categoryId)?.color,
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                }}
                                            />
                                        )}
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                            {getCategoryDetails(selectedSeat.categoryId)?.name || 'Sin asignar'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Fila {selectedSeat.row + 1}, Posición {selectedSeat.position + 1}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => onBackgroundClick?.()}
                                    sx={{
                                        ml: 1,
                                        bgcolor: 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <FiX size={16} />
                                </IconButton>
                            </Box>

                            {selectedSeat.categoryId ? (
                                <Box>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 1.5,
                                            bgcolor: getCategoryDetails(selectedSeat.categoryId)?.color,
                                            color: '#fff',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            fontSize: 14,
                                            mb: 1.5,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        ✓ Asiento Asignado
                                    </Box>
                                    <Tooltip title="Limpiar asignación de este escaño">
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            startIcon={<FiTrash2 />}
                                            onClick={() => onClearSeat?.(selectedSeat)}
                                            sx={{
                                                borderWidth: 2,
                                                '&:hover': { borderWidth: 2 }
                                            }}
                                        >
                                            Limpiar Asignación
                                        </Button>
                                    </Tooltip>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="body2" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                                        Asignar a una categoría:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                        {categories.map(cat => (
                                            <Tooltip key={cat.id} title={`Asignar a ${cat.name}`}>
                                                <Box
                                                    onClick={() => onAssignSeat?.(selectedSeat, cat.id)}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        cursor: 'pointer',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                            transform: 'scale(1.05)'
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            bgcolor: cat.color,
                                                            border: '3px solid #fff',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#fff',
                                                            fontWeight: 'bold',
                                                            fontSize: 12
                                                        }}
                                                    >
                                                        {cat.seatCount || 0}
                                                    </Box>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            maxWidth: 60,
                                                            textAlign: 'center',
                                                            fontSize: 10,
                                                            lineHeight: 1.2
                                                        }}
                                                    >
                                                        {cat.name}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -10,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderBottom: `10px solid ${selectedSeat.categoryId
                                        ? getCategoryDetails(selectedSeat.categoryId)?.color
                                        : 'white'}`,
                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.05))'
                                }}
                            />
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Podio/Mesa Presidencial */}
            <motion.div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '8%',
                    transform: 'translateX(-50%)',
                    width: 80,
                    height: 40,
                    backgroundColor: '#5f6368',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14,
                    zIndex: 2
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                🏛️
            </motion.div>

            {/* Label de total de asientos */}
            <Typography
                variant="caption"
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'text.secondary',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    zIndex: 2,
                    fontWeight: 600
                }}
            >
                {layout.totalSeats} asientos
            </Typography>
        </Box>
    );
};

export default HemicicloSVG;
