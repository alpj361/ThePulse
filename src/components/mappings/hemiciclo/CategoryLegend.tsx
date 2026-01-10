import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import type { HemicicloCategory } from '../../../types/mappings';

interface CategoryLegendProps {
    categories: HemicicloCategory[];
    orientation?: 'horizontal' | 'vertical';
    showCounts?: boolean;
    onCategoryClick?: (categoryId: string) => void;
    selectedCategoryId?: string;
}

const CategoryLegend: React.FC<CategoryLegendProps> = ({
    categories,
    orientation = 'horizontal',
    showCounts = true,
    onCategoryClick,
    selectedCategoryId
}) => {
    if (categories.length === 0) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                flexWrap: 'wrap',
                gap: 1,
                p: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            {categories
                .sort((a, b) => a.order - b.order)
                .map(category => {
                    const isSelected = selectedCategoryId === category.id;
                    return (
                        <Chip
                            key={category.id}
                            onClick={onCategoryClick ? () => onCategoryClick(category.id) : undefined}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{category.shortName || category.name}</span>
                                    {showCounts && category.seatCount !== undefined && (
                                        <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                                            ({category.seatCount})
                                        </Typography>
                                    )}
                                </Box>
                            }
                            size="small"
                            sx={{
                                bgcolor: category.color,
                                color: '#fff',
                                fontWeight: 500,
                                cursor: onCategoryClick ? 'pointer' : 'default',
                                border: isSelected ? '3px solid #333' : '2px solid transparent',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.2s',
                                '& .MuiChip-label': {
                                    px: 1
                                },
                                '&:hover': onCategoryClick ? {
                                    transform: 'scale(1.08)',
                                    boxShadow: 2
                                } : undefined
                            }}
                        />
                    );
                })}
        </Box>
    );
};

export default CategoryLegend;
