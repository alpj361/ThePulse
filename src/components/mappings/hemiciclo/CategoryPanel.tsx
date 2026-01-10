import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Tooltip
} from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiMousePointer } from 'react-icons/fi';
import type { HemicicloCategory } from '../../../types/mappings';

interface CategoryPanelProps {
    categories: HemicicloCategory[];
    onCategoriesChange: (categories: HemicicloCategory[]) => void;
    disabled?: boolean;
    selectedCategoryId?: string;
    onCategorySelect?: (categoryId: string) => void;
}

// Predefined color palette
const COLOR_PALETTE = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395',
    '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300'
];

const CategoryPanel: React.FC<CategoryPanelProps> = ({
    categories,
    onCategoriesChange,
    disabled = false,
    selectedCategoryId,
    onCategorySelect
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<HemicicloCategory | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        color: COLOR_PALETTE[0]
    });

    const handleOpenDialog = (category?: HemicicloCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                shortName: category.shortName || '',
                color: category.color
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                shortName: '',
                color: COLOR_PALETTE[categories.length % COLOR_PALETTE.length]
            });
        }
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;

        let updatedCategories: HemicicloCategory[];

        if (editingCategory) {
            // Update existing
            updatedCategories = categories.map(c =>
                c.id === editingCategory.id
                    ? { ...c, ...formData }
                    : c
            );
        } else {
            // Add new
            const newCategory: HemicicloCategory = {
                id: `cat-${Date.now()}`,
                name: formData.name.trim(),
                shortName: formData.shortName.trim() || undefined,
                color: formData.color,
                order: categories.length + 1
            };
            updatedCategories = [...categories, newCategory];
        }

        onCategoriesChange(updatedCategories);
        setDialogOpen(false);
    };

    const handleDelete = (categoryId: string) => {
        const updated = categories
            .filter(c => c.id !== categoryId)
            .map((c, i) => ({ ...c, order: i + 1 }));
        onCategoriesChange(updated);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Categorías / Partidos
                </Typography>
                <Button
                    size="small"
                    startIcon={<FiPlus />}
                    onClick={() => handleOpenDialog()}
                    disabled={disabled}
                >
                    Agregar
                </Button>
            </Box>

            {onCategorySelect && categories.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Haz clic en una categoría para asignar asientos
                </Typography>
            )}

            {categories.length === 0 ? (
                <Box
                    sx={{
                        p: 3,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: 'grey.300'
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        No hay categorías definidas
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => handleOpenDialog()}
                        sx={{ mt: 1 }}
                        disabled={disabled}
                    >
                        Crear primera categoría
                    </Button>
                </Box>
            ) : (
                <List dense>
                    {categories
                        .sort((a, b) => a.order - b.order)
                        .map((category) => {
                            const isSelected = selectedCategoryId === category.id;
                            return (
                                <ListItem
                                    key={category.id}
                                    onClick={() => onCategorySelect?.(category.id)}
                                    sx={{
                                        bgcolor: isSelected ? 'primary.50' : 'background.paper',
                                        borderRadius: 1,
                                        mb: 0.5,
                                        border: '2px solid',
                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                        cursor: onCategorySelect ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: onCategorySelect ? 'action.hover' : undefined,
                                            transform: onCategorySelect ? 'scale(1.01)' : undefined
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            bgcolor: category.color,
                                            mr: 2,
                                            flexShrink: 0,
                                            border: isSelected ? '2px solid #333' : '2px solid transparent'
                                        }}
                                    />
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span>{category.name}</span>
                                                {isSelected && (
                                                    <Chip
                                                        label="Asignando"
                                                        size="small"
                                                        color="primary"
                                                        icon={<FiMousePointer size={12} />}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            category.seatCount !== undefined
                                                ? `${category.seatCount} asientos`
                                                : undefined
                                        }
                                    />
                                    {category.shortName && (
                                        <Chip
                                            label={category.shortName}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDialog(category);
                                                }}
                                                disabled={disabled}
                                            >
                                                <FiEdit2 size={14} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(category.id);
                                                }}
                                                disabled={disabled}
                                            >
                                                <FiTrash2 size={14} />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            );
                        })}
                </List>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Nombre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mt: 2 }}
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="Abreviatura (opcional)"
                        value={formData.shortName}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        sx={{ mt: 2 }}
                        placeholder="Ej: PL, UNE"
                    />

                    {/* Color picker */}
                    <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                        Color
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {COLOR_PALETTE.map(color => (
                            <Box
                                key={color}
                                onClick={() => setFormData({ ...formData, color })}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    bgcolor: color,
                                    cursor: 'pointer',
                                    border: formData.color === color ? '3px solid #333' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.name.trim()}>
                        {editingCategory ? 'Guardar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CategoryPanel;
