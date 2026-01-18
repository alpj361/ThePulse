import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Paper
} from '@mui/material';
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiMail,
    FiPhone,
    FiGlobe,
    FiUsers,
    FiFileText,
    FiHash,
    FiImage
} from 'react-icons/fi';
import type { CustomField, HemicicloDataSource } from '../../../types/mappings';
import CustomFieldModal from './CustomFieldModal';

interface CustomFieldsEditorProps {
    dataSource: HemicicloDataSource | undefined;
    projectId: string;
    onDataSourceChange: (dataSource: HemicicloDataSource) => void;
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

const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({
    dataSource,
    projectId,
    onDataSourceChange
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);

    const customFields = dataSource?.customFields || [];
    const hasDatasets = dataSource?.datasetIds && dataSource.datasetIds.length > 0;

    const handleAddField = () => {
        setEditingField(null);
        setModalOpen(true);
    };

    const handleEditField = (field: CustomField) => {
        setEditingField(field);
        setModalOpen(true);
    };

    const handleDeleteField = (fieldId: string) => {
        if (!dataSource) return;

        const updatedFields = customFields.filter(f => f.id !== fieldId);
        onDataSourceChange({
            ...dataSource,
            customFields: updatedFields
        });
    };

    const handleSaveField = (field: CustomField) => {
        if (!dataSource) return;

        let updatedFields: CustomField[];

        if (editingField) {
            // Update existing field
            updatedFields = customFields.map(f =>
                f.id === field.id ? field : f
            );
        } else {
            // Add new field
            updatedFields = [...customFields, field];
        }

        // Sort by order if specified
        updatedFields.sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            return orderA - orderB;
        });

        onDataSourceChange({
            ...dataSource,
            customFields: updatedFields
        });

        setModalOpen(false);
        setEditingField(null);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingField(null);
    };

    const getSourceLabel = (field: CustomField): string => {
        if (field.sourceType === 'column') {
            return `Columna: ${field.columnName}`;
        } else {
            return `Dataset relacionado`;
        }
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Campos Personalizados (Opcional)
            </Typography>

            {!hasDatasets ? (
                <Alert severity="info">
                    Primero debes conectar al menos un dataset para agregar campos personalizados.
                </Alert>
            ) : customFields.length === 0 ? (
                <Alert severity="info">
                    Agrega campos adicionales para mostrar más información de cada actor
                    (email, teléfono, comisiones, iniciativas, etc.)
                </Alert>
            ) : (
                <Paper variant="outlined" sx={{ p: 0 }}>
                    <List disablePadding>
                        {customFields.map((field, index) => (
                            <ListItem
                                key={field.id}
                                sx={{
                                    borderBottom: index < customFields.length - 1 ? '1px solid' : 'none',
                                    borderColor: 'divider'
                                }}
                                secondaryAction={
                                    <Box>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleEditField(field)}
                                            sx={{ mr: 0.5 }}
                                        >
                                            <FiEdit2 size={16} />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleDeleteField(field.id)}
                                            color="error"
                                        >
                                            <FiTrash2 size={16} />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemIcon>
                                    {getIcon(field.icon)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={field.label}
                                    secondary={
                                        <Box component="span">
                                            {getSourceLabel(field)}
                                            {' • '}
                                            <Box
                                                component="span"
                                                sx={{ textTransform: 'capitalize' }}
                                            >
                                                {field.displayType || 'text'}
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Button
                startIcon={<FiPlus />}
                onClick={handleAddField}
                disabled={!hasDatasets}
                sx={{ mt: 2 }}
                variant="outlined"
            >
                Agregar Campo Personalizado
            </Button>

            {modalOpen && (
                <CustomFieldModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveField}
                    editingField={editingField}
                    dataSource={dataSource!}
                    projectId={projectId}
                />
            )}
        </Box>
    );
};

export default CustomFieldsEditor;
