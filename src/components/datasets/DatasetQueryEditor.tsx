import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  FiPlay,
  FiCopy,
  FiDownload,
  FiClock,
  FiDatabase,
  FiZap
} from 'react-icons/fi';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { Dataset, datasetsService, QueryResult } from '../../services/datasets';
import { QUERY_SHORTCUTS } from '../../config/datasets';

interface DatasetQueryEditorProps {
  dataset: Dataset;
}

interface ShortcutTemplate {
  name: string;
  template: string;
  description: string;
}

const DatasetQueryEditor: React.FC<DatasetQueryEditorProps> = ({ dataset }) => {
  const [queryType, setQueryType] = useState<'sql' | 'python'>('sql');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShortcut, setSelectedShortcut] = useState('');

  // Initialize with a default query
  useEffect(() => {
    if (!query) {
      setQuery(queryType === 'sql'
        ? `-- Preview first 10 rows\nSELECT * FROM dataset LIMIT 10;`
        : `# Show dataset information\nimport pandas as pd\ndf = pd.DataFrame(data)\nprint(f"Dataset shape: {df.shape}")\nprint(df.head())`
      );
    }
  }, [queryType, query]);

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Please enter a query to execute');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await datasetsService.executeQuery(
        dataset.id,
        query,
        queryType
      );
      setResults(result);
    } catch (err) {
      console.error('Query execution failed:', err);
      setError(err instanceof Error ? err.message : 'Query execution failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutSelect = (shortcutTemplate: string) => {
    // Replace template variables with actual values
    let processedTemplate = shortcutTemplate
      .replace(/\{dataset_name\}/g, 'dataset')
      .replace(/\{column_name\}/g, dataset.schema_definition[0]?.name || 'column');

    setQuery(processedTemplate);
    setSelectedShortcut('');
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
  };

  const handleExportResults = () => {
    if (!results?.data || results.data.length === 0) return;

    const headers = Object.keys(results.data[0]);
    const csvContent = [
      headers.join(','),
      ...results.data.map(row =>
        headers.map(header => `"${String(row[header] || '')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_query_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentShortcuts = (): ShortcutTemplate[] => {
    return queryType === 'sql' ? QUERY_SHORTCUTS.SQL : QUERY_SHORTCUTS.PYTHON;
  };

  return (
    <Box>
      {/* Query Type and Shortcuts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Query Type
              </Typography>
              <Tabs
                value={queryType}
                onChange={(_, value) => setQueryType(value)}
                variant="fullWidth"
              >
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🗃️ SQL
                    </Box>
                  }
                  value="sql"
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🐍 Python
                    </Box>
                  }
                  value="python"
                />
              </Tabs>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Templates
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Choose a template</InputLabel>
                <Select
                  value={selectedShortcut}
                  label="Choose a template"
                  onChange={(e) => {
                    const shortcut = getCurrentShortcuts().find(s => s.name === e.target.value);
                    if (shortcut) {
                      handleShortcutSelect(shortcut.template);
                    }
                  }}
                >
                  {getCurrentShortcuts().map((shortcut) => (
                    <MenuItem key={shortcut.name} value={shortcut.name}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {shortcut.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shortcut.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Query Editor */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Query Editor
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy query">
              <IconButton size="small" onClick={handleCopyQuery}>
                <FiCopy />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <FiPlay />}
              onClick={handleExecute}
              disabled={loading || !query.trim()}
              sx={{
                bgcolor: 'success.main',
                '&:hover': { bgcolor: 'success.dark' }
              }}
            >
              {loading ? 'Executing...' : 'Run Query'}
            </Button>
          </Box>
        </Box>

        <CodeMirror
          value={query}
          height="300px"
          extensions={[queryType === 'sql' ? sql() : python()]}
          onChange={(value) => setQuery(value)}
          theme={oneDark}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false
          }}
        />
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Query Results */}
      {results && (
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">
                Query Results
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  icon={<FiDatabase size={14} />}
                  label={`${results.metadata.rows_returned.toLocaleString()} rows`}
                  size="small"
                  color="primary"
                />
                <Chip
                  icon={<FiClock size={14} />}
                  label={`${results.metadata.execution_time_ms}ms`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<FiZap size={14} />}
                  label={results.metadata.query_type.toUpperCase()}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            {results.data.length > 0 && (
              <Button
                startIcon={<FiDownload />}
                onClick={handleExportResults}
                size="small"
              >
                Export CSV
              </Button>
            )}
          </Box>

          {results.data.length > 0 ? (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(results.data[0]).map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.data.map((row, index) => (
                    <TableRow key={index} hover>
                      {Object.keys(results.data[0]).map((header) => (
                        <TableCell key={header}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {String(row[header] || '')}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Query executed successfully but returned no results.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Query Help */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Query Help:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            {queryType === 'sql' ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Use <code>SELECT * FROM dataset</code> to query your data</li>
                <li>Available columns: {dataset.schema_definition.map(col => col.name).join(', ')}</li>
                <li>Only SELECT queries are allowed for security</li>
                <li>Use LIMIT to control result size</li>
              </ul>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Your data is available as <code>data</code> variable (list of dictionaries)</li>
                <li>Use pandas: <code>df = pd.DataFrame(data)</code></li>
                <li>Basic operations supported: filtering, sorting, statistics</li>
                <li>Advanced Python execution coming in future updates</li>
              </ul>
            )}
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default DatasetQueryEditor;