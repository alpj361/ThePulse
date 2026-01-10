import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert
} from '@mui/material';
import { FiDatabase, FiLink } from 'react-icons/fi';
import { datasetsService, Dataset } from '../../../services/datasets';
import type { HemicicloDataSource } from '../../../types/mappings';

interface DataSourceSelectorProps {
    projectId: string;
    dataSource?: HemicicloDataSource;
    onDataSourceChange: (dataSource: HemicicloDataSource) => void;
    disabled?: boolean;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
    projectId,
    dataSource,
    onDataSourceChange,
    disabled = false
}) => {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

    // Load available datasets
    useEffect(() => {
        const loadDatasets = async () => {
            setLoading(true);
            try {
                const data = await datasetsService.listDatasets({
                    project_id: projectId,
                    visibility: 'all'
                });
                setDatasets(data);
            } catch (err) {
                console.error('Error loading datasets:', err);
            } finally {
                setLoading(false);
            }
        };
        loadDatasets();
    }, [projectId]);

    const handleAddDataset = () => {
        if (!selectedDatasetId) return;

        const currentIds = dataSource?.datasetIds || [];
        if (!currentIds.includes(selectedDatasetId)) {
            onDataSourceChange({
                type: 'dataset',
                datasetIds: [...currentIds, selectedDatasetId],
                columnMappings: dataSource?.columnMappings || {}
            });
        }
        setSelectedDatasetId('');
    };

    const handleRemoveDataset = (datasetId: string) => {
        const currentIds = dataSource?.datasetIds || [];
        onDataSourceChange({
            ...dataSource,
            type: 'dataset',
            datasetIds: currentIds.filter(id => id !== datasetId)
        });
    };

    const handleColumnMapping = (field: string, columnName: string) => {
        onDataSourceChange({
            ...dataSource,
            type: 'dataset',
            columnMappings: {
                ...dataSource?.columnMappings,
                [field]: columnName || undefined
            }
        });
    };

    const getDatasetName = (id: string) => {
        return datasets.find(d => d.id === id)?.name || id;
    };

    // Get all columns from selected datasets
    const getAllColumns = (): string[] => {
        const datasetIds = dataSource?.datasetIds || [];
        const allCols: string[] = [];

        datasetIds.forEach(dsId => {
            const ds = datasets.find(d => d.id === dsId);
            ds?.schema_definition?.forEach(col => {
                if (!allCols.includes(col.name)) {
                    allCols.push(col.name);
                }
            });
        });

        return allCols;
    };

    const linkedDatasets = dataSource?.datasetIds || [];
    const availableColumns = getAllColumns();

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Fuente de Datos
            </Typography>

            {/* Linked datasets */}
            {linkedDatasets.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Datasets vinculados:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {linkedDatasets.map(id => (
                            <Chip
                                key={id}
                                label={getDatasetName(id)}
                                icon={<FiDatabase size={14} />}
                                onDelete={disabled ? undefined : () => handleRemoveDataset(id)}
                                size="small"
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Add dataset */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Seleccionar Dataset</InputLabel>
                    <Select
                        value={selectedDatasetId}
                        onChange={(e) => setSelectedDatasetId(e.target.value)}
                        label="Seleccionar Dataset"
                        disabled={disabled || loading}
                    >
                        {datasets
                            .filter(d => !linkedDatasets.includes(d.id))
                            .map(ds => (
                                <MenuItem key={ds.id} value={ds.id}>
                                    {ds.name}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
                <Button
                    variant="outlined"
                    onClick={handleAddDataset}
                    disabled={!selectedDatasetId || disabled}
                    startIcon={<FiLink />}
                >
                    Vincular
                </Button>
            </Box>

            {/* Column mappings (only if datasets are linked) */}
            {linkedDatasets.length > 0 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Mapeo de columnas:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Actor column */}
                        <FormControl size="small" fullWidth>
                            <InputLabel>Columna de Actor</InputLabel>
                            <Select
                                value={dataSource?.columnMappings?.actor || ''}
                                onChange={(e) => handleColumnMapping('actor', e.target.value)}
                                label="Columna de Actor"
                                disabled={disabled}
                            >
                                <MenuItem value="">-- No asignado --</MenuItem>
                                {availableColumns.map(col => (
                                    <MenuItem key={col} value={col}>{col}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Category column */}
                        <FormControl size="small" fullWidth>
                            <InputLabel>Columna de Categoría/Partido</InputLabel>
                            <Select
                                value={dataSource?.columnMappings?.category || ''}
                                onChange={(e) => handleColumnMapping('category', e.target.value)}
                                label="Columna de Categoría/Partido"
                                disabled={disabled}
                            >
                                <MenuItem value="">-- No asignado --</MenuItem>
                                {availableColumns.map(col => (
                                    <MenuItem key={col} value={col}>{col}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Photo column (optional) */}
                        <FormControl size="small" fullWidth>
                            <InputLabel>Columna de Foto (opcional)</InputLabel>
                            <Select
                                value={dataSource?.columnMappings?.photo || ''}
                                onChange={(e) => handleColumnMapping('photo', e.target.value)}
                                label="Columna de Foto (opcional)"
                                disabled={disabled}
                            >
                                <MenuItem value="">-- No asignado --</MenuItem>
                                {availableColumns.map(col => (
                                    <MenuItem key={col} value={col}>{col}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            )}

            {linkedDatasets.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Vincula un dataset o asigna asientos manualmente
                </Alert>
            )}
        </Box>
    );
};

export default DataSourceSelector;
