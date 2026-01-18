import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Box,
    Chip,
    Link
} from '@mui/material';
import {
    FiChevronDown,
    FiMail,
    FiPhone,
    FiGlobe,
    FiUsers,
    FiExternalLink,
    FiFileText,
    FiHash,
    FiImage
} from 'react-icons/fi';
import type { CustomField } from '../../../types/mappings';

interface CustomFieldsDisplayProps {
    customFields: CustomField[];
    metadata: Record<string, any>;
}

// Helper to get icon component from icon string
const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactElement> = {
        FiMail: <FiMail />,
        FiPhone: <FiPhone />,
        FiGlobe: <FiGlobe />,
        FiUsers: <FiUsers />,
        FiFileText: <FiFileText />,
        FiHash: <FiHash />,
        FiImage: <FiImage />
    };

    return iconName && iconMap[iconName] ? iconMap[iconName] : <FiFileText />;
};

// Render different display types
const CustomFieldRenderer: React.FC<{
    value: any;
    displayType?: string;
}> = ({ value, displayType }) => {
    if (value === null || value === undefined || value === '') {
        return <Typography variant="body2" color="text.secondary">N/A</Typography>;
    }

    switch (displayType) {
        case 'url':
            return (
                <Link
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                    {String(value)}
                    <FiExternalLink size={12} />
                </Link>
            );

        case 'image':
            return (
                <Box
                    component="img"
                    src={String(value)}
                    alt="Custom field image"
                    sx={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                />
            );

        case 'list':
            if (Array.isArray(value)) {
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {value.map((item, i) => (
                            <Chip
                                key={i}
                                label={String(item)}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                );
            }
            return <Typography variant="body2">{String(value)}</Typography>;

        case 'number':
            return (
                <Typography variant="body2" fontWeight={500}>
                    {Number(value).toLocaleString()}
                </Typography>
            );

        default: // text
            return <Typography variant="body2">{String(value)}</Typography>;
    }
};

const CustomFieldsDisplay: React.FC<CustomFieldsDisplayProps> = ({
    customFields,
    metadata
}) => {
    // Filter fields that have values
    const fieldsWithValues = customFields.filter(field => {
        const value = metadata[field.id];
        return value !== null && value !== undefined && value !== '';
    });

    if (fieldsWithValues.length === 0) {
        return null;
    }

    return (
        <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<FiChevronDown />}>
                <Typography variant="subtitle2">
                    Información Adicional ({fieldsWithValues.length})
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <List dense disablePadding>
                    {customFields.map(field => {
                        const value = metadata[field.id];
                        if (value === null || value === undefined || value === '') {
                            return null;
                        }

                        return (
                            <ListItem
                                key={field.id}
                                sx={{
                                    px: 0,
                                    py: 1,
                                    alignItems: 'flex-start'
                                }}
                            >
                                {field.icon && (
                                    <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                                        {getIcon(field.icon)}
                                    </ListItemIcon>
                                )}
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                            {field.label}
                                        </Typography>
                                    }
                                    secondary={
                                        <CustomFieldRenderer
                                            value={value}
                                            displayType={field.displayType}
                                        />
                                    }
                                    sx={{ my: 0 }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </AccordionDetails>
        </Accordion>
    );
};

export default CustomFieldsDisplay;
