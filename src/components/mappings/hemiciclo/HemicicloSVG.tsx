import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, useTheme, Paper, IconButton, Grid, Tooltip, getContrastRatio } from '@mui/material';
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
                width: width,
                height: 'auto',
                aspectRatio: '2/1',
                background: `linear-gradient(180deg, #f0f8ff 0%, #e6f3ff 100%)`,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'visible'
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
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: isHovered ? styles.hover : styles.bg,
                                    border: isSelected
                                        ? '3px solid #1976d2'
                                        : isAssignable
                                            ? `2px dashed ${selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.color : '#666'}`
                                            : `1.5px solid ${styles.border}`,
                                    boxShadow: isSelected
                                        ? '0 0 10px rgba(25,118,210,0.6)'
                                        : isHovered
                                            ? '0 4px 12px rgba(0,0,0,0.3)'
                                            : '0 1px 3px rgba(0,0,0,0.15)',
                                    transition: 'background-color 0.2s, box-shadow 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {seat.actorData?.name && (
                                    <span style={{
                                        fontSize: 7,
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

            {/* Selected Seat Action Menu */}
            <AnimatePresence>
                {selectedSeat && editable && !selectedCategoryId && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: `${selectedSeat.x}%`,
                            bottom: `calc(${100 - selectedSeat.y}% + 20px)`,
                            transform: 'translateX(-50%)',
                            zIndex: 50
                        }}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Paper
                            elevation={4}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                minWidth: 200,
                                bgcolor: 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                        {selectedSeat.actorData?.name || `Asiento ${selectedSeat.row + 1}-${selectedSeat.position + 1}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {getCategoryDetails(selectedSeat.categoryId)?.name || 'Sin asignar'}
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={() => onBackgroundClick?.()} sx={{ ml: 1, mt: -1, mr: -1 }}>
                                    <FiX size={14} />
                                </IconButton>
                            </Box>

                            {selectedSeat.categoryId ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            height: 32,
                                            borderRadius: 1,
                                            bgcolor: getCategoryDetails(selectedSeat.categoryId)?.color || '#eee',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: 12,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Asignado
                                    </Box>
                                    <Tooltip title="Limpiar asignación">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            sx={{ border: '1px solid', borderColor: 'error.light', borderRadius: 1 }}
                                            onClick={() => onClearSeat?.(selectedSeat)}
                                        >
                                            <FiTrash2 size={16} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                                        Asignar categoría:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {categories.map(cat => (
                                            <Grid item key={cat.id}>
                                                <Tooltip title={cat.name}>
                                                    <Box
                                                        onClick={() => onAssignSeat?.(selectedSeat, cat.id)}
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            bgcolor: cat.color,
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.2s',
                                                            border: '2px solid transparent',
                                                            '&:hover': {
                                                                transform: 'scale(1.2)',
                                                                borderColor: 'text.primary'
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderTop: '8px solid white',
                                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))'
                                }}
                            />
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '88%',
                    transform: 'translate(-50%, -50%)',
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

            <Typography
                variant="caption"
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'text.secondary',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    px: 1,
                    borderRadius: 1,
                    zIndex: 2
                }}
            >
                {layout.totalSeats} asientos
            </Typography>
        </Box>
    );
};

export default HemicicloSVG;
