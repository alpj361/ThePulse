import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import type { CustomField, HemicicloDataSource } from '../../../types/mappings';
import { datasetsService } from '../../../services/datasets';

interface CustomFieldModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (field: CustomField) => void;
    editingField: CustomField | null;
    dataSource: HemicicloDataSource;
    projectId: string;
}

const CustomFieldModal: React.FC<CustomFieldModalProps> = ({
    open,
    onClose,
    onSave,
    editingField,
    dataSource,
    projectId
}) => {
    // Form state
    const [label, setLabel] = useState('');
    const [sourceType, setSourceType] = useState<'column' | 'dataset'>('column');
    const [columnName, setColumnName] = useState('');
    const [relatedDatasetId, setRelatedDatasetId] = useState('');
    const [keyColumnLocal, setKeyColumnLocal] = useState('');
    const [keyColumnRelated, setKeyColumnRelated] = useState('');
    const [valueColumn, setValueColumn] = useState('');
    const [displayType, setDisplayType] = useState<'text' | 'number' | 'url' | 'image' | 'list'>('text');
    const [icon, setIcon] = useState('');

    // Data state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);
    const [actorDatasets, setActorDatasets] = useState<any[]>([]);
    const [relatedColumns, setRelatedColumns] = useState<string[]>([]);

    // Initialize form with editing field
    useEffect(() => {
        if (editingField) {
            setLabel(editingField.label);
            setSourceType(editingField.sourceType);
            setColumnName(editingField.columnName || '');
            setRelatedDatasetId(editingField.relatedDatasetId || '');
            setKeyColumnLocal(editingField.keyColumnLocal || '');
            setKeyColumnRelated(editingField.keyColumnRelated || '');
            setValueColumn(editingField.valueColumn || '');
            setDisplayType(editingField.displayType || 'text');
            setIcon(editingField.icon || '');
        } else {
            // Reset form for new field
            setLabel('');
            setSourceType('column');
            setColumnName('');
            setRelatedDatasetId('');
            setKeyColumnLocal('');
            setKeyColumnRelated('');
            setValueColumn('');
            setDisplayType('text');
            setIcon('');
        }
    }, [editingField]);

    // Load available columns from current dataset
    useEffect(() => {
        if (open && dataSource.datasetIds && dataSource.datasetIds.length > 0) {
            loadAvailableColumns();
        }
    }, [open, dataSource.datasetIds]);

    // Load actor datasets when sourceType is 'dataset'
    useEffect(() => {
        if (open && sourceType === 'dataset') {
            loadActorDatasets();
        }
    }, [open, sourceType]);

    // Load related columns when related dataset is selected
    useEffect(() => {
        if (relatedDatasetId) {
            loadRelatedColumns(relatedDatasetId);
        }
    }, [relatedDatasetId]);

    const loadAvailableColumns = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get all columns from all linked datasets
            const allCols: string[] = [];

            for (const dsId of dataSource.datasetIds!) {
                const dataset = await datasetsService.getDataset(dsId);

                if (dataset.schema_definition) {
                    dataset.schema_definition.forEach((col: any) => {
                        if (!allCols.includes(col.name)) {
                            allCols.push(col.name);
                        }
                    });
                }
            }

            setAvailableColumns(allCols);
        } catch (err) {
            console.error('Error loading columns:', err);
            setError('Error al cargar las columnas disponibles');
        } finally {
            setLoading(false);
        }
    };

    const loadActorDatasets = async () => {
        try {
            setLoading(true);
            setError(null);

            const datasets = await datasetsService.listDatasets({
                project_id: projectId
            });

            // Filter to only datasets with actor columns
            const actorDs = datasets.filter((ds: any) => {
                if (!ds.schema_definition) return false;
                return ds.schema_definition.some((col: any) => col.type === 'actor');
            });

            setActorDatasets(actorDs);
        } catch (err) {
            console.error('Error loading actor datasets:', err);
            setError('Error al cargar datasets con actores');
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedColumns = async (datasetId: string) => {
        try {
            const dataset = await datasetsService.getDataset(datasetId);

            if (dataset.schema_definition) {
                const cols = dataset.schema_definition.map((col: any) => col.name);
                setRelatedColumns(cols);
            }
        } catch (err) {
            console.error('Error loading related columns:', err);
        }
    };

    const handleSave = () => {
        // Validation
        if (!label.trim()) {
            setError('El nombre del campo es requerido');
            return;
        }

        if (sourceType === 'column' && !columnName) {
            setError('Debes seleccionar una columna');
            return;
        }

        if (sourceType === 'dataset') {
            if (!relatedDatasetId || !keyColumnLocal || !keyColumnRelated || !valueColumn) {
                setError('Debes completar toda la configuración del dataset relacionado');
                return;
            }
        }

        // Create field object
        const field: CustomField = {
            id: editingField?.id || `field-${Date.now()}`,
            label,
            sourceType,
            columnName: sourceType === 'column' ? columnName : undefined,
            relatedDatasetId: sourceType === 'dataset' ? relatedDatasetId : undefined,
            keyColumnLocal: sourceType === 'dataset' ? keyColumnLocal : undefined,
            keyColumnRelated: sourceType === 'dataset' ? keyColumnRelated : undefined,
            valueColumn: sourceType === 'dataset' ? valueColumn : undefined,
            displayType,
            icon: icon || undefined,
            order: editingField?.order
        };

        onSave(field);
    };

    const handleSourceTypeChange = (newType: 'column' | 'dataset') => {
        setSourceType(newType);
        // Reset related fields
        setColumnName('');
        setRelatedDatasetId('');
        setKeyColumnLocal('');
        setKeyColumnRelated('');
        setValueColumn('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {editingField ? 'Editar Campo Personalizado' : 'Agregar Campo Personalizado'}
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Step 1: Basic Info */}
                <TextField
                    label="Nombre del campo"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                    helperText="Ej: Email, Teléfono, Comisiones, Iniciativas de Ley"
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Fuente de datos</InputLabel>
                    <Select
                        value={sourceType}
                        onChange={(e) => handleSourceTypeChange(e.target.value as 'column' | 'dataset')}
                        label="Fuente de datos"
                    >
                        <MenuItem value="column">
                            Columna del dataset actual
                        </MenuItem>
                        <MenuItem value="dataset">
                            Dataset relacionado (con actores)
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* Step 2a: Column Selection */}
                {sourceType === 'column' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Columna</InputLabel>
                        <Select
                            value={columnName}
                            onChange={(e) => setColumnName(e.target.value)}
                            label="Columna"
                        >
                            {availableColumns.map(col => (
                                <MenuItem key={col} value={col}>{col}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Step 2b: Dataset Join Configuration */}
                {sourceType === 'dataset' && (
                    <>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Dataset relacionado</InputLabel>
                            <Select
                                value={relatedDatasetId}
                                onChange={(e) => setRelatedDatasetId(e.target.value)}
                                label="Dataset relacionado"
                            >
                                {actorDatasets.map(ds => (
                                    <MenuItem key={ds.id} value={ds.id}>
                                        {ds.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Configura cómo unir los datos de ambos datasets
                        </Alert>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Columna local (clave)</InputLabel>
                                    <Select
                                        value={keyColumnLocal}
                                        onChange={(e) => setKeyColumnLocal(e.target.value)}
                                        label="Columna local (clave)"
                                    >
                                        {availableColumns.map(col => (
                                            <MenuItem key={col} value={col}>{col}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Columna relacionada (clave)</InputLabel>
                                    <Select
                                        value={keyColumnRelated}
                                        onChange={(e) => setKeyColumnRelated(e.target.value)}
                                        label="Columna relacionada (clave)"
                                        disabled={!relatedDatasetId}
                                    >
                                        {relatedColumns.map(col => (
                                            <MenuItem key={col} value={col}>{col}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Columna de valor</InputLabel>
                            <Select
                                value={valueColumn}
                                onChange={(e) => setValueColumn(e.target.value)}
                                label="Columna de valor"
                                disabled={!relatedDatasetId}
                            >
                                {relatedColumns.map(col => (
                                    <MenuItem key={col} value={col}>{col}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </>
                )}

                {/* Step 3: Display Type */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Tipo de visualización</InputLabel>
                    <Select
                        value={displayType}
                        onChange={(e) => setDisplayType(e.target.value as any)}
                        label="Tipo de visualización"
                    >
                        <MenuItem value="text">Texto</MenuItem>
                        <MenuItem value="number">Número</MenuItem>
                        <MenuItem value="url">Enlace (URL)</MenuItem>
                        <MenuItem value="image">Imagen</MenuItem>
                        <MenuItem value="list">Lista (múltiples valores)</MenuItem>
                    </Select>
                </FormControl>

                {/* Step 4: Icon (Optional) */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Icono (opcional)</InputLabel>
                    <Select
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        label="Icono (opcional)"
                    >
                        <MenuItem value="">Sin icono</MenuItem>
                        <MenuItem value="FiMail">✉️ Email</MenuItem>
                        <MenuItem value="FiPhone">📞 Teléfono</MenuItem>
                        <MenuItem value="FiGlobe">🌐 Web/URL</MenuItem>
                        <MenuItem value="FiUsers">👥 Grupos/Comisiones</MenuItem>
                        <MenuItem value="FiFileText">📄 Documentos</MenuItem>
                        <MenuItem value="FiHash">🔢 Número/ID</MenuItem>
                        <MenuItem value="FiImage">🖼️ Imagen</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                >
                    {editingField ? 'Guardar Cambios' : 'Agregar Campo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomFieldModal;
