import React, { useState, useCallback } from 'react';
import { Column, Cell } from 'react-datasheet-grid';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import { FiExternalLink, FiLink } from 'react-icons/fi';
import { UrlValue } from '../../../types/datasetEditor';

interface UrlCellProps {
  rowData: any;
  colIndex: number;
  columnId: string;
  value: UrlValue | string | null;
  onChange: (value: UrlValue | string | null) => void;
}

const UrlCell: React.FC<UrlCellProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Extract URL string from value with error handling
  let urlString = '';
  try {
    urlString = typeof value === 'string' ? value : (value?.url || '');
  } catch (error) {
    console.error('Error extracting URL:', error);
    urlString = '';
  }

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleStartEdit = () => {
    setInputValue(urlString);
    setIsEditing(true);
  };

  const handleFinishEdit = useCallback(() => {
    try {
      const trimmedValue = inputValue.trim();

      if (!trimmedValue) {
        onChange(null);
      } else {
        const valid = isValidUrl(trimmedValue);
        setIsValid(valid);

        // Store as UrlValue object with validation
        const urlValue: UrlValue = {
          url: trimmedValue,
          isValid: valid
        };

        onChange(urlValue);
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
      setInputValue(urlString);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    // Only open on CMD+Click (Mac) or Ctrl+Click (Windows/Linux)
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      if (urlString && isValidUrl(urlString)) {
        window.open(urlString, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (isEditing) {
    return (
      <TextField
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleFinishEdit}
        onKeyDown={handleKeyPress}
        placeholder="https://..."
        size="small"
        fullWidth
        autoFocus
        error={!isValid && inputValue.trim() !== ''}
        helperText={!isValid && inputValue.trim() !== '' ? 'Invalid URL' : ''}
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '14px'
          }
        }}
      />
    );
  }

  if (!urlString) {
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
        Click to add URL...
      </Box>
    );
  }

  const isUrlValid = isValidUrl(urlString);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        padding: '4px 8px',
        cursor: 'pointer'
      }}
      onClick={handleStartEdit}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <FiLink
          size={14}
          color={isUrlValid ? '#1976d2' : '#f44336'}
          style={{ marginRight: '8px', flexShrink: 0 }}
        />

        <Tooltip title={isUrlValid ? `CMD+Click to open: ${urlString}` : 'Invalid URL'}>
          <Box
            component="span"
            onClick={handleLinkClick}
            sx={{
              flex: 1,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: isUrlValid ? 'primary.main' : 'error.main',
              textDecoration: isUrlValid ? 'none' : 'none',
              fontSize: '14px',
              '&:hover': {
                textDecoration: isUrlValid ? 'underline' : 'none'
              }
            }}
          >
            {urlString}
          </Box>
        </Tooltip>

        {isUrlValid && (
          <Tooltip title="CMD+Click to open in new tab">
            <IconButton
              size="small"
              onClick={handleLinkClick}
              sx={{
                padding: '2px',
                marginLeft: '4px',
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              <FiExternalLink size={12} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export const urlColumn = (columnId: string): Column<any, UrlValue | string | null> => ({
  ...{
    component: ({ rowData, colIndex, focus, active, setActive }) => {
      // Safety check for null/undefined rowData
      if (!rowData) {
        console.warn(`⚠️ urlColumn ${columnId} - rowData is null/undefined`);
        return (
          <UrlCell
            rowData={{}}
            colIndex={colIndex}
            columnId={columnId}
            value={null}
            onChange={() => {}}
          />
        );
      }

      // Convert string URLs to UrlValue objects for backward compatibility
      const currentValue = rowData[columnId];
      let normalizedValue: UrlValue | string | null = currentValue;

      // If it's a plain string URL, convert to UrlValue object
      if (typeof currentValue === 'string' && currentValue.trim()) {
        const urlString = currentValue.trim();
        if (/^https?:\/\/.+/i.test(urlString)) {
          normalizedValue = {
            url: urlString,
            isValid: true // Will be validated by the component
          } as UrlValue;
          // Update the row data with the normalized value
          rowData[columnId] = normalizedValue;
        }
      }

      return (
        <UrlCell
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
        } as UrlValue;
      }
    }
  }
});