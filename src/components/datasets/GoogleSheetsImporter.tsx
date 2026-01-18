/**
 * GoogleSheetsImporter - Component for importing data from Google Sheets
 * Supports automatic synchronization
 * Only visible to Alpha users
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  Chip,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { FiRefreshCw, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import {
  initializeSheetsClient,
  getSpreadsheetMetadata,
  readSheetData,
  extractSpreadsheetId,
  isValidSpreadsheetId,
  convertSheetToDataset,
  type SheetMetadata
} from '../../services/googleSheets';

interface GoogleSheetsImporterProps {
  onDataImported: (data: {
    data: any[];
    schema: any[];
    sheetData: {
      spreadsheetId: string;
      sheetName: string;
      title: string;
    };
    syncConfig?: {
      enabled: boolean;
      interval: number;
    };
  }) => void;
  onError: (error: string) => void;
}

const GoogleSheetsImporter: React.FC<GoogleSheetsImporterProps> = ({
  onDataImported,
  onError
}) => {
  const { token, requestToken, loading: authLoading, openPicker } = useGoogleDrive();

  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Sync configuration
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(10); // Default 10 minutes

  const [step, setStep] = useState<'input' | 'select-sheet' | 'preview'>('input');

  // Extract spreadsheet ID when URL changes
  useEffect(() => {
    if (spreadsheetUrl) {
      const id = extractSpreadsheetId(spreadsheetUrl);
      if (id) {
        setSpreadsheetId(id);
      } else if (isValidSpreadsheetId(spreadsheetUrl)) {
        // User entered ID directly
        setSpreadsheetId(spreadsheetUrl);
      }
    }
  }, [spreadsheetUrl]);

  // Handle selection from Google Picker
  const handlePickerSelect = async () => {
    try {
      setLoading(true);
      onError('');

      await openPicker(async (driveFile) => {
        console.log('📊 Selected spreadsheet from picker:', driveFile);

        // Check if it's a Google Sheets file
        if (driveFile.mimeType !== 'application/vnd.google-apps.spreadsheet') {
          onError('Por favor selecciona un archivo de Google Sheets');
          setLoading(false);
          return;
        }

        // Set the spreadsheet ID and connect
        setSpreadsheetId(driveFile.id);
        setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${driveFile.id}`);

        // Now connect to the sheet
        await connectToSheet(driveFile.id);
      });
    } catch (err) {
      console.error('Error opening picker:', err);
      onError(err instanceof Error ? err.message : 'Error abriendo selector de Google');
      setLoading(false);
    }
  };

  // Connect to sheet (extracted for reuse)
  const connectToSheet = async (sheetId: string) => {
    try {
      setLoading(true);
      onError('');

      if (!sheetId) {
        onError('Por favor ingresa una URL o ID válido de Google Sheets');
        return;
      }

      // Ensure user is authenticated
      if (!token) {
        await requestToken();
        return; // Will retry after auth
      }

      // Initialize Sheets API
      await initializeSheetsClient();

      // Get spreadsheet metadata
      const meta = await getSpreadsheetMetadata(sheetId, token);
      setMetadata(meta);

      if (meta.sheets.length === 1) {
        // Only one sheet, select it automatically
        setSelectedSheet(meta.sheets[0].title);
        await loadSheetPreview(meta.sheets[0].title, sheetId);
      } else {
        // Multiple sheets, let user choose
        setStep('select-sheet');
      }

    } catch (err) {
      console.error('Error connecting to sheet:', err);
      onError(err instanceof Error ? err.message : 'Error conectando con Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    await connectToSheet(spreadsheetId);
  };

  const loadSheetPreview = async (sheetName: string, sheetIdOverride?: string) => {
    try {
      setLoading(true);
      onError('');

      if (!token) {
        await requestToken();
        return;
      }

      const idToUse = sheetIdOverride || spreadsheetId;
      const sheetData = await readSheetData(idToUse, sheetName, token);
      setPreviewData(sheetData);
      setStep('preview');

    } catch (err) {
      console.error('Error loading sheet preview:', err);
      onError(err instanceof Error ? err.message : 'Error cargando datos del Sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    await loadSheetPreview(sheetName);
  };

  const handleImport = () => {
    if (!previewData || !metadata) {
      onError('No hay datos para importar');
      return;
    }

    const converted = convertSheetToDataset(previewData);

    onDataImported({
      data: converted.jsonData,
      schema: converted.schemaDefinition,
      sheetData: {
        spreadsheetId,
        sheetName: selectedSheet,
        title: metadata.title
      },
      syncConfig: syncEnabled ? {
        enabled: true,
        interval: syncInterval
      } : undefined
    });
  };

  // Render different steps
  const renderInputStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiRefreshCw />
        Conectar Google Sheets
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Selecciona un archivo de Google Sheets o ingresa su URL
      </Typography>

      {/* Primary action: Use Picker */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handlePickerSelect}
        disabled={loading || authLoading}
        startIcon={loading || authLoading ? <CircularProgress size={20} /> : <FiDownload />}
        sx={{ mb: 3 }}
      >
        {authLoading ? 'Autenticando...' : loading ? 'Conectando...' : 'Seleccionar de Google Drive'}
      </Button>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">o pega la URL</Typography>
      </Divider>

      <TextField
        fullWidth
        label="URL o ID del Spreadsheet"
        placeholder="https://docs.google.com/spreadsheets/d/..."
        value={spreadsheetUrl}
        onChange={(e) => setSpreadsheetUrl(e.target.value)}
        sx={{ mb: 2 }}
        helperText="También puedes pegar la URL completa o solo el ID del spreadsheet"
        size="small"
      />

      <Button
        variant="outlined"
        fullWidth
        onClick={handleConnect}
        disabled={!spreadsheetId || loading || authLoading}
        startIcon={loading ? <CircularProgress size={20} /> : <FiRefreshCw />}
      >
        {loading ? 'Conectando...' : 'Conectar con URL'}
      </Button>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Nota:</strong> Se solicitarán permisos de lectura a tus Google Sheets
        </Typography>
      </Alert>
    </Box>
  );

  const renderSelectSheetStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Selecciona una hoja
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        El spreadsheet <strong>{metadata?.title}</strong> tiene múltiples hojas
      </Typography>

      <List>
        {metadata?.sheets.map((sheet) => (
          <Card
            key={sheet.sheetId}
            variant="outlined"
            sx={{
              mb: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => handleSheetSelect(sheet.title)}
          >
            <CardContent>
              <ListItem disablePadding>
                <ListItemText
                  primary={sheet.title}
                  secondary={`${sheet.gridProperties.rowCount} filas × ${sheet.gridProperties.columnCount} columnas`}
                />
                <FiCheckCircle style={{ color: selectedSheet === sheet.title ? '#4caf50' : '#ccc' }} />
              </ListItem>
            </CardContent>
          </Card>
        ))}
      </List>

      <Button
        variant="text"
        onClick={() => setStep('input')}
        sx={{ mt: 1 }}
      >
        ← Cambiar spreadsheet
      </Button>
    </Box>
  );

  const renderPreviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vista Previa de Datos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {metadata?.title} → {selectedSheet}
      </Typography>

      {previewData && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Estadísticas
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip label={`${previewData.rowCount} filas`} color="primary" size="small" />
                <Chip label={`${previewData.columns.length} columnas`} color="secondary" size="small" />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Columnas detectadas
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {previewData.columns.map((col: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={`${col.name} (${col.type})`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Sync Configuration */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'info.50' }}>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={syncEnabled}
                    onChange={(e) => setSyncEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">
                      Habilitar sincronización automática
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      El dataset se actualizará automáticamente cuando agregues filas al Sheet
                    </Typography>
                  </Box>
                }
              />

              {syncEnabled && (
                <Box sx={{ mt: 2, ml: 4 }}>
                  <FormControl fullWidth size="small">
                    <FormLabel sx={{ mb: 1 }}>Intervalo de sincronización</FormLabel>
                    <RadioGroup
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                    >
                      <FormControlLabel value={5} control={<Radio />} label="Cada 5 minutos" />
                      <FormControlLabel value={10} control={<Radio />} label="Cada 10 minutos (Recomendado)" />
                      <FormControlLabel value={15} control={<Radio />} label="Cada 15 minutos" />
                    </RadioGroup>
                  </FormControl>

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Modelo híbrido:</strong> Las filas se sincronizarán desde el Sheet (no podrás crear filas manualmente), pero podrás agregar columnas adicionales en ThePulse.
                    </Typography>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2}>
            <Button
              variant="text"
              onClick={() => setStep('select-sheet')}
            >
              ← Cambiar hoja
            </Button>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleImport}
              startIcon={<FiDownload />}
            >
              Importar Dataset
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );

  return (
    <Box>
      {step === 'input' && renderInputStep()}
      {step === 'select-sheet' && renderSelectSheetStep()}
      {step === 'preview' && renderPreviewStep()}
    </Box>
  );
};

export default GoogleSheetsImporter;
