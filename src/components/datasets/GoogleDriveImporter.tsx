/**
 * GoogleDriveImporter - Component for importing files from Google Drive
 * Only visible to Alpha users
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';

interface GoogleDriveImporterProps {
  onFileSelected: (file: File) => void;
  onError: (error: string) => void;
}

const GoogleDriveImporter: React.FC<GoogleDriveImporterProps> = ({
  onFileSelected,
  onError
}) => {
  const { openPicker, loading, error: driveError } = useGoogleDrive();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const handleSelectFile = async () => {
    try {
      await openPicker(async (driveFile) => {
        console.log('📁 Selected Drive file:', driveFile);
        setSelectedFile(driveFile);

        // Check if file type is supported
        const supportedTypes = [
          'application/json',
          'text/csv',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (driveFile.mimeType && !supportedTypes.includes(driveFile.mimeType)) {
          onError('Tipo de archivo no soportado. Usa JSON, CSV o Excel.');
          return;
        }

        // Download the file
        await downloadFile(driveFile);
      });
    } catch (err) {
      console.error('Error opening Drive picker:', err);
      onError(err instanceof Error ? err.message : 'Error abriendo Google Drive');
    }
  };

  const downloadFile = async (driveFile: any) => {
    try {
      setDownloading(true);

      // Fetch file content from Google Drive
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${(window as any).gapi.client.getToken().access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo descargar el archivo de Drive');
      }

      const blob = await response.blob();
      const file = new File([blob], driveFile.name, { type: driveFile.mimeType || 'application/octet-stream' });

      console.log('✅ File downloaded from Drive:', file);
      onFileSelected(file);

    } catch (err) {
      console.error('Error downloading file:', err);
      onError(err instanceof Error ? err.message : 'Error descargando archivo de Drive');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiDownload />
        Importar desde Google Drive
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Selecciona un archivo CSV, JSON o Excel de tu Google Drive
      </Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {!selectedFile ? (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSelectFile}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <FiDownload />}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Abriendo Drive...' : 'Seleccionar de Drive'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Se abrirá el selector de archivos de Google Drive
                </Typography>
              </>
            ) : (
              <>
                <FiFileText size={48} style={{ marginBottom: 16, color: '#4285f4' }} />
                <Typography variant="subtitle1" gutterBottom>
                  {selectedFile.name}
                </Typography>
                <Chip
                  label={selectedFile.mimeType || 'Archivo'}
                  size="small"
                  sx={{ mb: 2 }}
                />
                {downloading && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Descargando archivo...
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {(driveError || error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {driveError || error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Tipos de archivo soportados:</strong> CSV, JSON, Excel
        </Typography>
      </Alert>
    </Box>
  );
};

export default GoogleDriveImporter;
