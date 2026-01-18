import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import { FiMap, FiMoreVertical, FiClock, FiTrash2 } from 'react-icons/fi';
import type { BaseMapping } from '../../types/mappings';

interface MappingCardProps {
    mapping: BaseMapping;
    onClick?: () => void;
    onDelete?: (mappingId: string) => void;
}

const MappingCard: React.FC<MappingCardProps> = ({ mapping, onClick, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const menuOpen = Boolean(anchorEl);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            hemiciclo: 'Hemiciclo'
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, any> = {
            hemiciclo: 'primary'
        };
        return colors[type] || 'default';
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (onDelete) {
            onDelete(mapping.id);
        }
        setDeleteDialogOpen(false);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <Card
                sx={{
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': onClick ? {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                    } : {},
                    border: '1px solid',
                    borderColor: 'divider'
                }}
                onClick={onClick}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <FiMap size={20} color="#1976d2" />
                            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                                {mapping.name}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={handleMenuOpen}>
                            <FiMoreVertical size={16} />
                        </IconButton>
                    </Box>

                    {mapping.description && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}
                        >
                            {mapping.description}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip
                            label={getTypeLabel(mapping.type)}
                            color={getTypeColor(mapping.type)}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FiClock size={14} color="#666" />
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(mapping.created_at)}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <FiTrash2 size={18} color="inherit" />
                    </ListItemIcon>
                    <ListItemText>Eliminar</ListItemText>
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>¿Eliminar mapeo?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas eliminar "{mapping.name}"? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MappingCard;
