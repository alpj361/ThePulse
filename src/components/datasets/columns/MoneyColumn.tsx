import React, { useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  Box,
  InputAdornment,
  FormControl
} from '@mui/material';
import { MoneyValue, Currency, CURRENCY_SYMBOLS, CURRENCY_NAMES } from '../../../types/datasetEditor';

interface MoneyColumnProps {
  value: MoneyValue | null;
  onChange: (value: MoneyValue | null) => void;
  defaultCurrency?: Currency;
  disabled?: boolean;
  focus?: boolean;
}

const MoneyColumnEditor: React.FC<MoneyColumnProps> = ({
  value,
  onChange,
  defaultCurrency = 'GTQ',
  disabled = false,
  focus = false
}) => {
  const [localValue, setLocalValue] = useState<MoneyValue>(
    value || { amount: null, currency: defaultCurrency }
  );

  const handleAmountChange = (amount: string) => {
    const numAmount = amount === '' ? null : parseFloat(amount);
    const newValue = { ...localValue, amount: isNaN(numAmount!) ? null : numAmount };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleCurrencyChange = (currency: Currency) => {
    const newValue = { ...localValue, currency };
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <TextField
        variant="outlined"
        size="small"
        type="number"
        value={localValue.amount ?? ''}
        onChange={(e) => handleAmountChange(e.target.value)}
        disabled={disabled}
        autoFocus={focus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {CURRENCY_SYMBOLS[localValue.currency]}
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' }
          }
        }}
      />
      <FormControl size="small" sx={{ minWidth: 70 }}>
        <Select
          value={localValue.currency}
          onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
          disabled={disabled}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' }
          }}
        >
          {Object.entries(CURRENCY_NAMES).map(([code, name]) => (
            <MenuItem key={code} value={code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{CURRENCY_SYMBOLS[code as Currency]}</span>
                <small>{code}</small>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

const MoneyColumnDisplay: React.FC<{ value: MoneyValue | null }> = ({ value }) => {
  if (!value || value.amount === null) {
    return <span style={{ color: '#999' }}>-</span>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <span>{CURRENCY_SYMBOLS[value.currency]}</span>
      <span>{value.amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</span>
      <small style={{ color: '#666' }}>{value.currency}</small>
    </Box>
  );
};

export const createMoneyColumn = (defaultCurrency: Currency = 'GTQ') => {
  return {
    component: ({ rowData, setRowData, focus, disabled }: any) => (
      <MoneyColumnEditor
        value={rowData || null}
        onChange={(newValue) => setRowData(newValue)}
        defaultCurrency={defaultCurrency}
        focus={focus}
        disabled={disabled}
      />
    ),
    deleteValue: () => null,
    copyValue: ({ rowData }: any) =>
      rowData ? `${CURRENCY_SYMBOLS[rowData.currency]}${rowData.amount ?? ''}` : '',
    pasteValue: ({ value }: any) => {
      if (typeof value !== 'string') return null;

      // Parse pasted values like "Q1500.00" or "$100" or "1500"
      const match = value.match(/^([Q$€]?)(\d+(?:\.\d{2})?).*$/);
      if (!match) return null;

      const [, symbol, amount] = match;
      const currency = symbol === 'Q' ? 'GTQ' :
        symbol === '$' ? 'USD' :
          symbol === '€' ? 'EUR' : defaultCurrency;

      return {
        amount: parseFloat(amount),
        currency
      };
    },
    minWidth: 150
  };
};