import React, { useState, useCallback, useRef } from 'react';
import { Column, Cell } from 'react-datasheet-grid';
import {
  Box,
  TextField,
  Tooltip,
  Popper,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import { FiImage, FiAlertCircle } from 'react-icons/fi';
import { ImageValue } from '../../../types/datasetEditor';

interface ImageCellProps {
  rowData: any;
  colIndex: number;
  columnId: string;
  value: ImageValue | string | null;
  onChange: (value: ImageValue | string | null) => void;
}

const IMAGE_PREVIEW_SIZE = { width: 200, height: 150 };
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

const ImageCell: React.FC<ImageCellProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Extract URL string from value with error handling
  let imageUrl = '';
  try {
    imageUrl = typeof value === 'string' ? value : (value?.url || '');
  } catch (error) {
    console.error('Error extracting image URL:', error);
    imageUrl = '';
  }

  // Image URL validation function
  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const extension = pathname.split('.').pop();
      return extension ? SUPPORTED_FORMATS.includes(extension) : false;
    } catch {
      return false;
    }
  };

  const handleStartEdit = () => {
    setInputValue(imageUrl);
    setIsEditing(true);
  };

  const handleFinishEdit = useCallback(() => {
    try {
      const trimmedValue = inputValue.trim();

      if (!trimmedValue) {
        onChange(null);
      } else {
        const valid = isValidImageUrl(trimmedValue);
        setIsValid(valid);

        // Store as ImageValue object with validation
        const imageValue: ImageValue = {
          url: trimmedValue,
          isValid: valid
        };

        onChange(imageValue);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error in handleFinishEdit:', error);
      setIsEditing(false);
    }
  }, [inputValue, onChange]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(imageUrl);
    }
  };

  const handleMouseEnter = () => {
    if (imageUrl && isValidImageUrl(imageUrl)) {
      setPreviewOpen(true);
      setImageLoading(true);
      setImageError(false);
    }
  };

  const handleMouseLeave = () => {
    setPreviewOpen(false);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  if (isEditing) {
    return (
      <TextField
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleFinishEdit}
        onKeyDown={handleKeyPress}
        placeholder="https://example.com/image.jpg"
        size="small"
        fullWidth
        autoFocus
        error={!isValid && inputValue.trim() !== ''}
        helperText={!isValid && inputValue.trim() !== '' ? 'Invalid image URL' : ''}
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '14px'
          }
        }}
      />
    );
  }

  if (!imageUrl) {
    return (
      <Box
        onClick={handleStartEdit}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          cursor: 'text',
          padding: '8px',
          color: 'text.disabled'
        }}
      >
        Click to add image URL...
      </Box>
    );
  }

  const isImageValid = isValidImageUrl(imageUrl);

  return (
    <>
      <Box
        ref={anchorRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          padding: '4px 8px',
          cursor: 'pointer'
        }}
        onClick={handleStartEdit}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {isImageValid ? (
            <FiImage
              size={14}
              color="#1976d2"
              style={{ marginRight: '8px', flexShrink: 0 }}
            />
          ) : (
            <FiAlertCircle
              size={14}
              color="#f44336"
              style={{ marginRight: '8px', flexShrink: 0 }}
            />
          )}

          <Box
            component="span"
            sx={{
              flex: 1,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: isImageValid ? 'primary.main' : 'error.main',
              fontSize: '14px'
            }}
          >
            {imageUrl}
          </Box>
        </Box>
      </Box>

      {/* Image Preview Popper */}
      <Popper
        open={previewOpen && isImageValid}
        anchorEl={anchorRef.current}
        placement="top"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
        sx={{ zIndex: 1400 }}
      >
        <Paper
          elevation={8}
          sx={{
            padding: 1,
            maxWidth: IMAGE_PREVIEW_SIZE.width + 16,
            maxHeight: IMAGE_PREVIEW_SIZE.height + 40,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {imageLoading && !imageError && (
            <Box
              sx={{
                width: IMAGE_PREVIEW_SIZE.width,
                height: IMAGE_PREVIEW_SIZE.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.100'
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}

          {imageError && (
            <Box
              sx={{
                width: IMAGE_PREVIEW_SIZE.width,
                height: IMAGE_PREVIEW_SIZE.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.100',
                flexDirection: 'column'
              }}
            >
              <FiAlertCircle size={24} color="#f44336" />
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                Failed to load image
              </Typography>
            </Box>
          )}

          <Box
            component="img"
            src={imageUrl}
            alt="Preview"
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              maxWidth: IMAGE_PREVIEW_SIZE.width,
              maxHeight: IMAGE_PREVIEW_SIZE.height,
              objectFit: 'contain',
              display: imageLoading || imageError ? 'none' : 'block',
              borderRadius: 1
            }}
          />

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: 'text.secondary',
              fontSize: '11px'
            }}
          >
            {imageUrl}
          </Typography>
        </Paper>
      </Popper>
    </>
  );
};

export const imageColumn = (columnId: string): Column<any, ImageValue | string | null> => ({
  ...{
    component: ({ rowData, colIndex, focus, active, setActive }) => {
      // Safety check for null/undefined rowData
      if (!rowData) {
        console.warn(`⚠️ imageColumn ${columnId} - rowData is null/undefined`);
        return (
          <ImageCell
            rowData={{}}
            colIndex={colIndex}
            columnId={columnId}
            value={null}
            onChange={() => {}}
          />
        );
      }

      // Convert string URLs to ImageValue objects for backward compatibility
      const currentValue = rowData[columnId];
      let normalizedValue: ImageValue | string | null = currentValue;

      // Debug log
      console.log(`🔄 imageColumn ${columnId} - currentValue:`, currentValue, 'rowData:', rowData);

      // Handle different data structures
      if (typeof currentValue === 'string' && currentValue.trim()) {
        // Standard case: value is a string URL
        const urlString = currentValue.trim();
        console.log(`🔗 Converting string URL to ImageValue: ${urlString}`);
        if (/^https?:\/\/.+/i.test(urlString)) {
          normalizedValue = {
            url: urlString,
            isValid: /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(urlString)
          } as ImageValue;
          rowData[columnId] = normalizedValue;
          console.log(`✅ Converted to ImageValue:`, normalizedValue);
        }
      } else if (currentValue === undefined && typeof rowData === 'string') {
        // Special case: entire rowData is the URL string (flattened structure)
        const urlString = rowData.trim();
        console.log(`🔗 Converting rowData string to ImageValue: ${urlString}`);
        if (/^https?:\/\/.+/i.test(urlString)) {
          normalizedValue = {
            url: urlString,
            isValid: /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(urlString)
          } as ImageValue;
          console.log(`✅ Converted rowData to ImageValue:`, normalizedValue);
        }
      } else {
        console.log(`❌ No conversion needed for ${columnId}:`, typeof currentValue, currentValue);
      }

      return (
        <ImageCell
          rowData={rowData}
          colIndex={colIndex}
          columnId={columnId}
          value={normalizedValue}
          onChange={(newValue) => {
            rowData[columnId] = newValue;
            setActive?.(true);
          }}
        />
      );
    },
    disableKeys: true,
    keepFocus: false,
    deleteValue: () => null,
    copyValue: ({ rowData }) => {
      const value = rowData[columnId];
      return typeof value === 'string' ? value : (value?.url || '');
    },
    pasteValue: ({ rowData }, value) => {
      const trimmedValue = String(value).trim();
      if (!trimmedValue) {
        rowData[columnId] = null;
      } else {
        rowData[columnId] = {
          url: trimmedValue,
          isValid: true // Will be validated on next render
        } as ImageValue;
      }
    }
  }
});