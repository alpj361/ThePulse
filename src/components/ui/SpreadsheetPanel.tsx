import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DataSheetGrid,
  checkboxColumn,
  textColumn,
  keyColumn,
  intColumn,
  dateColumn,
  floatColumn
} from 'react-datasheet-grid';
import { X } from 'lucide-react';
import { FaPlus, FaTrash, FaDownload, FaUpload, FaSave, FaUndo, FaCog, FaBroom, FaQuestionCircle } from 'react-icons/fa';
import { useSpreadsheet } from '../../context/SpreadsheetContext';
import 'react-datasheet-grid/dist/style.css';

interface ColumnConfig {
  id: string;
  title: string;
  type: 'text' | 'number' | 'integer' | 'checkbox' | 'date' | 'float';
  minWidth?: number;
}

interface SpreadsheetPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpreadsheetPanel: React.FC<SpreadsheetPanelProps> = ({ isOpen, onClose }) => {
  // Usar el contexto del spreadsheet
  const {
    data: contextData,
    columnConfigs: contextColumns,
    setSpreadsheetData,
    lastAddedTitle
  } = useSpreadsheet();

  // Estados locales para edición
  const [localData, setLocalData] = useState<Record<string, any>[]>([]);
  const [localColumnConfigs, setLocalColumnConfigs] = useState<ColumnConfig[]>([]);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showFormulaHelper, setShowFormulaHelper] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [columnAggregations, setColumnAggregations] = useState<Record<string, 'none' | 'sum' | 'avg' | 'median'>>({});

  // Cargar datos cuando se abre el panel (UNA SOLA VEZ)
  useEffect(() => {
    console.log('📊 Panel Effect Triggered:', { isOpen, localDataLength: localData.length, contextDataLength: contextData.length });

    if (isOpen) {
      // Detectar si el estado actual es "inicializado en blanco" (20 filas vacías por defecto)
      // Esto permite que si los datos llegan tarde (race condition), sobrescriban la inicialización en blanco
      const isBlankInit = localData.length === 20 &&
        localData[0]?.id?.startsWith('row_') &&
        (localData[0]?.col_a === undefined || localData[0]?.col_a === ''); // Check loose heuristic

      // Logic: Load if empty OR if we currently have the "blank init" state and real data arrived
      // ALSO: If column configs are missing (e.g. after reopen), we MUST reload
      if (localData.length === 0 || localColumnConfigs.length === 0 || (contextData.length > 0 && isBlankInit)) {
        console.log('📊 Panel: Inicializando...', {
          contextDataCount: contextData.length,
          isBlankInit,
          missingConfigs: localColumnConfigs.length === 0
        });
        setIsLoading(true);

        const loadTimeout = setTimeout(() => {
          // Capturar los datos del contexto en el momento de la carga
          const currentContextData = contextData;
          const currentContextColumns = contextColumns;

          console.log('📊 Panel Timeout Executed:', {
            hasContextData: currentContextData.length > 0,
            rows: currentContextData.length,
            cols: currentContextColumns.length
          });

          if (currentContextData.length > 0) {
            // SI hay datos en el contexto, los usamos
            console.log(`✅ Panel: Cargados ${currentContextData.length} tweets de contexto`);
            setLocalData([...currentContextData]);
            setLocalColumnConfigs([...currentContextColumns]);
            // Inicializar agregaciones por defecto
            const initAgg: Record<string, 'none' | 'sum' | 'avg' | 'median'> = {};
            currentContextColumns.forEach((c) => {
              initAgg[c.id] = ['integer', 'number', 'float'].includes((c as any).type) ? 'sum' : 'none';
            });
            setColumnAggregations(initAgg);
          } else if (localData.length === 0) {
            // SOLO inicializar en blanco si no tenemos NADA (ni siquiera los blanks anteriores)
            // Si ya teníamos blanks (isBlankInit), y contextData es vacío, no hacemos nada (mantenemos blanks)
            console.log('📝 Panel: Inicializando spreadsheet en blanco (Contexto vacío)');
            // Crear múltiples filas vacías para simular Google Sheets
            const blankRows = Array.from({ length: 20 }, (_, index) => {
              const row: Record<string, any> = { id: `row_${index + 1}` };
              // Inicializar columnas según su tipo
              const columnTypes = {
                'col_a': 'text', 'col_b': 'text', 'col_c': 'number', 'col_d': 'number',
                'col_e': 'float', 'col_f': 'text', 'col_g': 'checkbox', 'col_h': 'date',
                'col_i': 'integer', 'col_j': 'text'
              };

              Object.entries(columnTypes).forEach(([colId, type]) => {
                switch (type) {
                  case 'checkbox':
                    row[colId] = false;
                    break;
                  case 'date':
                    row[colId] = null;
                    break;
                  case 'integer':
                  case 'number':
                  case 'float':
                    row[colId] = null;
                    break;
                  default:
                    row[colId] = '';
                }
              });
              return row;
            });

            setLocalData(blankRows);

            setLocalColumnConfigs([
              { id: 'col_a', title: 'Columna A', type: 'text', minWidth: 120 },
              { id: 'col_b', title: 'Columna B', type: 'text', minWidth: 120 },
              { id: 'col_c', title: 'Columna C', type: 'number', minWidth: 100 },
              { id: 'col_d', title: 'Columna D', type: 'number', minWidth: 100 },
              { id: 'col_e', title: 'Columna E', type: 'float', minWidth: 100 },
              { id: 'col_f', title: 'Columna F', type: 'text', minWidth: 120 },
              { id: 'col_g', title: 'Columna G', type: 'checkbox', minWidth: 80 },
              { id: 'col_h', title: 'Columna H', type: 'date', minWidth: 140 },
              { id: 'col_i', title: 'Columna I', type: 'integer', minWidth: 100 },
              { id: 'col_j', title: 'Columna J', type: 'text', minWidth: 120 }
            ]);
            setColumnAggregations({
              col_a: 'none', col_b: 'none', col_c: 'sum', col_d: 'sum', col_e: 'sum', col_f: 'none', col_g: 'none', col_h: 'none', col_i: 'sum', col_j: 'none'
            });
          }
          setIsLoading(false);
        }, 50);

        return () => clearTimeout(loadTimeout);
      }
    }
  }, [isOpen, contextData, contextColumns, localColumnConfigs.length]); // Modified to react to data updates

  // Limpiar datos cuando se cierra el panel
  useEffect(() => {
    if (!isOpen) {
      setLocalColumnConfigs([]);
      setIsLoading(false);
      setShowColumnEditor(false);
      setShowFormulaHelper(false);
    }
  }, [isOpen]);

  // Función para sincronizar cambios locales con el contexto (solo cuando sea explícito)
  const syncWithContext = useCallback(() => {
    if (localData.length > 0) {
      setSpreadsheetData(localData, localColumnConfigs);
    }
  }, [localData, localColumnConfigs, setSpreadsheetData]);

  // NO hay sincronización automática - solo manual cuando se guarda

  // Función para generar IDs únicos
  const genId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // Sistema de fórmulas básicas
  const evaluateFormula = useCallback((formula: string, currentData: Record<string, any>[]): number | string => {
    if (!formula || !formula.startsWith('=')) {
      return formula;
    }

    // Remover el = del inicio
    const expression = formula.slice(1).toUpperCase();

    try {
      // Funciones básicas implementadas
      if (expression.startsWith('SUM(') && expression.endsWith(')')) {
        const numbers = extractNumbers(expression, currentData);
        return numbers.reduce((sum, num) => sum + num, 0);
      }

      if (expression.startsWith('SUB(') && expression.endsWith(')')) {
        const numbers = extractNumbers(expression, currentData);
        return numbers.length > 0 ? numbers.reduce((result, num, index) =>
          index === 0 ? num : result - num) : 0;
      }

      if (expression.startsWith('MUL(') && expression.endsWith(')')) {
        const numbers = extractNumbers(expression, currentData);
        return numbers.reduce((result, num) => result * num, 1);
      }

      if (expression.startsWith('DIV(') && expression.endsWith(')')) {
        const numbers = extractNumbers(expression, currentData);
        if (numbers.length < 2) return 'Error: DIV requiere al menos 2 números';
        const result = numbers.reduce((result, num, index) =>
          index === 0 ? num : result / num);
        return Number.isFinite(result) ? result : 'Error: División por cero';
      }

      // Si no es una función reconocida, intentar evaluar como expresión simple
      const simpleResult = evaluateSimpleExpression(expression, currentData);
      return simpleResult;

    } catch (error) {
      return `Error: ${formula}`;
    }
  }, []);

  // Función auxiliar para extraer números de una función
  const extractNumbers = (expression: string, currentData: Record<string, any>[]): number[] => {
    const content = expression.slice(4, -1); // Remover función( y )
    const parts = content.split(',').map(part => part.trim());

    return parts.map(part => {
      // Si es un número directo
      if (!isNaN(Number(part))) {
        return Number(part);
      }

      // Si es una referencia a celda (formato: ROWNUMBER.COLUMNID)
      if (part.includes('.')) {
        const [rowStr, columnId] = part.split('.');
        const rowIndex = parseInt(rowStr) - 1; // Convertir a índice 0-based

        if (rowIndex >= 0 && rowIndex < currentData.length) {
          const value = currentData[rowIndex][columnId.toLowerCase()];
          return Number(value) || 0;
        }
      }

      return 0;
    });
  };

  // Función para evaluar expresiones simples (ej: "5+3", "10*2")
  const evaluateSimpleExpression = (expression: string, currentData: Record<string, any>[]): number | string => {
    // Reemplazar referencias de celdas por valores
    let processedExpression = expression.replace(/(\d+)\.([A-Z_]+)/g, (_match, row, col) => {
      const rowIndex = parseInt(row) - 1;
      if (rowIndex >= 0 && rowIndex < currentData.length) {
        const value = currentData[rowIndex][col.toLowerCase()];
        return String(Number(value) || 0);
      }
      return '0';
    });

    // Evaluar operaciones básicas de forma segura
    try {
      // Solo permitir números, operadores básicos y paréntesis
      if (!/^[0-9+\-*/().\s]+$/.test(processedExpression)) {
        return 'Error: Caracteres no válidos';
      }

      // Evaluar la expresión
      const result = Function('"use strict"; return (' + processedExpression + ')')();
      return Number.isFinite(result) ? result : 'Error: Resultado inválido';
    } catch (error) {
      return 'Error: Expresión inválida';
    }
  };

  // Función para obtener el tipo de columna correcto
  const getColumnType = useCallback((type: string) => {
    switch (type) {
      case 'checkbox': return checkboxColumn;
      case 'integer': return intColumn;
      case 'number':
      case 'float': return floatColumn;
      case 'date': return dateColumn;
      default: return textColumn;
    }
  }, []);

  // Configuración de columnas dinámicas
  const columns = useMemo(() => {
    if (!localColumnConfigs || localColumnConfigs.length === 0) {
      return [];
    }

    return localColumnConfigs.map(config => {
      const baseColumn = getColumnType(config.type);
      return {
        ...keyColumn(config.id, baseColumn),
        title: config.title,
        minWidth: config.minWidth || 120,
        basis: config.minWidth || 120,
        grow: 1,
      };
    });
  }, [localColumnConfigs, getColumnType]);

  // Función para crear nueva fila basada en las columnas configuradas
  const createRow = useCallback(() => {
    const newRow: Record<string, any> = { id: genId() };
    localColumnConfigs.forEach(config => {
      switch (config.type) {
        case 'checkbox':
          newRow[config.id] = false;
          break;
        case 'date':
          newRow[config.id] = null;
          break;
        case 'integer':
        case 'number':
        case 'float':
          newRow[config.id] = null;
          break;
        default:
          newRow[config.id] = '';
      }
    });
    return newRow;
  }, [genId, localColumnConfigs]);

  // Función para duplicar fila
  const duplicateRow = useCallback(({ rowData }: any) => ({
    ...rowData,
    id: genId(),
  }), [genId]);

  // Funciones para manejar columnas

  const removeColumn = useCallback((columnId: string) => {
    if (localColumnConfigs.length <= 1) {
      alert('Debe mantener al menos una columna');
      return;
    }

    setLocalColumnConfigs(prev => prev.filter(col => col.id !== columnId));

    // Remover la columna de todos los datos
    setLocalData(prev => prev.map(row => {
      const { [columnId]: removed, ...rest } = row;
      return rest;
    }));
  }, [localColumnConfigs.length]);

  const updateColumn = useCallback((columnId: string, updates: Partial<ColumnConfig>) => {
    setLocalColumnConfigs(prev => prev.map(col =>
      col.id === columnId ? { ...col, ...updates } : col
    ));
  }, []);

  // Funciones para manejar datos
  const handleSave = useCallback(() => {
    const saveData = {
      data: localData,
      columnConfigs: localColumnConfigs
    };
    localStorage.setItem('spreadsheet-data', JSON.stringify(saveData));
    syncWithContext(); // Sincronizar con el contexto cuando se guarda
    alert('Datos guardados y sincronizados!');
  }, [localData, localColumnConfigs, syncWithContext]);

  const handleLoad = useCallback(() => {
    const saved = localStorage.getItem('spreadsheet-data');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (parsedData.data && parsedData.columnConfigs) {
          setLocalData(parsedData.data);
          setLocalColumnConfigs(parsedData.columnConfigs);
        } else {
          // Formato antiguo - solo datos
          setLocalData(parsedData);
        }
        alert('Datos cargados exitosamente!');
      } catch (error) {
        alert('Error al cargar los datos');
      }
    } else {
      alert('No hay datos guardados');
    }
  }, []);

  const handleClear = useCallback(() => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
      setLocalData([createRow()]);
    }
  }, [createRow]);

  const handleExport = useCallback(() => {
    const exportData = {
      data: localData,
      columnConfigs: localColumnConfigs,
      exportDate: new Date().toISOString(),
      source: lastAddedTitle ? `Datos de: ${lastAddedTitle}` : 'Spreadsheet interno'
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spreadsheet-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [localData, localColumnConfigs, lastAddedTitle]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (importedData.data && importedData.columnConfigs) {
            setLocalData(importedData.data);
            setLocalColumnConfigs(importedData.columnConfigs);
          } else {
            // Formato antiguo o datos simples
            setLocalData(importedData);
          }
          alert('Datos importados exitosamente!');
        } catch (error) {
          alert('Error al importar los datos. Verifica que el archivo sea válido.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }, []);

  const addRow = useCallback(() => {
    setLocalData(prevData => [...prevData, createRow()]);
  }, [createRow]);

  const removeLastRow = useCallback(() => {
    if (localData.length > 1) {
      setLocalData(prevData => prevData.slice(0, -1));
    }
  }, [localData.length]);

  // Agregados: filas de cálculo (Total, Promedio, Mediana)
  const getNumericColumnIds = useCallback(() => {
    return localColumnConfigs
      .filter(c => ['integer', 'number', 'float'].includes(c.type))
      .map(c => c.id);
  }, [localColumnConfigs]);

  const computeMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const addSummaryRow = useCallback((mode: 'TOTAL' | 'PROMEDIO' | 'MEDIANA') => {
    const numericCols = getNumericColumnIds();
    if (numericCols.length === 0) {
      alert('No hay columnas numéricas para calcular');
      return;
    }
    const newRow: Record<string, any> = { id: genId() };
    // Poner etiqueta en la primera columna de texto disponible
    const firstTextCol = localColumnConfigs.find(c => c.type === 'text');
    if (firstTextCol) newRow[firstTextCol.id] = mode === 'TOTAL' ? 'Total' : mode === 'PROMEDIO' ? 'Promedio' : 'Mediana';
    // Calcular por columna
    numericCols.forEach(colId => {
      const values = localData
        .map(r => Number(r[colId]))
        .filter(v => Number.isFinite(v));
      let val = 0;
      if (mode === 'TOTAL') val = values.reduce((s, n) => s + n, 0);
      if (mode === 'PROMEDIO') val = values.length ? values.reduce((s, n) => s + n, 0) / values.length : 0;
      if (mode === 'MEDIANA') val = computeMedian(values);
      newRow[colId] = Number.isFinite(val) ? Number(val.toFixed(2)) : 0;
    });
    setLocalData(prev => [...prev, newRow]);
  }, [getNumericColumnIds, localColumnConfigs, localData, genId]);

  // Cálculo dinámico por columna según selección (fila fija al fondo)
  const computeAggregationValue = useCallback((colId: string): number | string => {
    const agg = columnAggregations[colId] || 'none';
    if (agg === 'none') return '';
    const values = localData
      .map(r => Number(r[colId]))
      .filter(v => Number.isFinite(v));
    if (values.length === 0) return '';
    if (agg === 'sum') return values.reduce((s, n) => s + n, 0);
    if (agg === 'avg') return Number((values.reduce((s, n) => s + n, 0) / values.length).toFixed(2));
    if (agg === 'median') return Number(computeMedian(values).toFixed(2));
    return '';
  }, [columnAggregations, localData]);

  // Eliminar fila por índice (1..N)
  const deleteRowByIndex = useCallback(() => {
    if (localData.length === 0) return;
    const idxStr = prompt(`Ingrese el número de fila a eliminar (1..${localData.length})`);
    if (!idxStr) return;
    const idx = parseInt(idxStr, 10);
    if (Number.isNaN(idx) || idx < 1 || idx > localData.length) {
      alert('Índice inválido');
      return;
    }
    setLocalData(prev => prev.filter((_, i) => i !== (idx - 1)));
  }, [localData.length]);

  // Exportar CSV
  const handleExportCSV = useCallback(() => {
    if (localData.length === 0 || localColumnConfigs.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    const headers = localColumnConfigs.map(c => c.id);
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = typeof val === 'string' ? val : JSON.stringify(val);
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const lines = [headers.join(',')];
    for (const row of localData) {
      lines.push(headers.map(h => escape((row as any)[h])).join(','));
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [localData, localColumnConfigs]);

  // Función para procesar cambios en el spreadsheet y evaluar fórmulas
  const handleSpreadsheetChange = useCallback((newData: Record<string, any>[]) => {
    // Procesar fórmulas en los datos
    const processedData = newData.map(row => {
      const processedRow = { ...row };

      // Evaluar fórmulas en cada celda
      Object.keys(processedRow).forEach(key => {
        if (key !== 'id' && typeof processedRow[key] === 'string') {
          const value = processedRow[key];
          if (value && value.startsWith('=')) {
            processedRow[key] = evaluateFormula(value, newData);
          }
        }
      });

      return processedRow;
    });

    setLocalData(processedData);
  }, [evaluateFormula]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-6xl h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-800">Sheets</h2>
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
              Experimental
            </span>
            {isLoading ? (
              <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                ⏳ Sincronizando...
              </span>
            ) : (
              <span className="text-sm text-gray-500">({localData.length} filas)</span>
            )}
            {lastAddedTitle && !isLoading && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                📊 {lastAddedTitle}
              </span>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            {/* Botón de ayuda para fórmulas */}
            <button
              onClick={() => setShowFormulaHelper(!showFormulaHelper)}
              className={`p-2 rounded-md transition-colors ${showFormulaHelper
                ? 'text-blue-800 bg-blue-100'
                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              title="Ayuda de fórmulas"
            >
              <FaQuestionCircle size={18} />
            </button>

            <div className="border-l border-gray-300 mx-2 h-6"></div>
            <button
              onClick={addRow}
              disabled={isLoading}
              className={`p-2 rounded-md transition-colors ${isLoading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                }`}
              title="Agregar fila"
            >
              <FaPlus size={20} />
            </button>

            {/* Filas de cálculo: Total / Promedio / Mediana */}
            <button
              onClick={() => addSummaryRow('TOTAL')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-xs font-medium border ${isLoading ? 'text-gray-400 border-gray-200' : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}
              title="Añadir fila Total"
            >
              Σ Total
            </button>
            <button
              onClick={() => addSummaryRow('PROMEDIO')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-xs font-medium border ${isLoading ? 'text-gray-400 border-gray-200' : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}
              title="Añadir fila Promedio"
            >
              AVG
            </button>
            <button
              onClick={() => addSummaryRow('MEDIANA')}
              disabled={isLoading}
              className={`px-2 py-1 rounded-md text-xs font-medium border ${isLoading ? 'text-gray-400 border-gray-200' : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}
              title="Añadir fila Mediana"
            >
              MED
            </button>

            <button
              onClick={removeLastRow}
              disabled={isLoading || localData.length <= 1}
              className={`p-2 rounded-md transition-colors ${isLoading || localData.length <= 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                }`}
              title="Eliminar última fila"
            >
              <FaTrash size={20} />
            </button>

            <button
              onClick={deleteRowByIndex}
              disabled={isLoading || localData.length === 0}
              className={`px-2 py-1 rounded-md text-xs font-medium border ${isLoading ? 'text-gray-400 border-gray-200' : 'text-red-600 hover:bg-red-50 border-red-200'}`}
              title="Eliminar fila por número"
            >
              Eliminar fila #
            </button>

            <div className="border-l border-gray-300 mx-2 h-6"></div>

            <button
              onClick={handleSave}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              title="Guardar datos"
            >
              <FaSave size={20} />
            </button>

            <button
              onClick={handleLoad}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
              title="Cargar datos guardados"
            >
              <FaUndo size={20} />
            </button>

            <button
              onClick={handleExport}
              className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
              title="Exportar datos"
            >
              <FaDownload size={20} />
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2 py-1 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors border border-orange-200 text-xs font-medium"
              title="Exportar CSV"
            >
              CSV
            </button>

            <label className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors cursor-pointer" title="Importar datos">
              <FaUpload size={20} />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleClear}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              title="Limpiar todos los datos"
            >
              <FaBroom size={20} />
            </button>

            <div className="border-l border-gray-300 mx-2 h-6"></div>

            <button
              onClick={() => setShowColumnEditor(!showColumnEditor)}
              disabled={isLoading}
              className={`p-2 transition-colors rounded-md ${isLoading
                ? 'text-gray-400 cursor-not-allowed'
                : showColumnEditor
                  ? 'text-blue-800 bg-blue-100'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              title="Configurar columnas"
            >
              <FaCog size={20} />
            </button>

            <div className="border-l border-gray-300 mx-2 h-6"></div>

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Column Editor */}
        {showColumnEditor && (
          <div className="p-4 border-b border-gray-200 bg-gray-50 max-h-60 overflow-auto">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Configuración de Columnas</h3>
            <div className="space-y-2">
              {localColumnConfigs.map((column) => (
                <div key={column.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => updateColumn(column.id, { title: e.target.value })}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="Título de columna"
                  />

                  <select
                    value={column.type}
                    onChange={(e) => updateColumn(column.id, { type: e.target.value as any })}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="text">Texto</option>
                    <option value="integer">Número entero</option>
                    <option value="float">Número decimal</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="date">Fecha</option>
                  </select>

                  <input
                    type="number"
                    value={column.minWidth}
                    onChange={(e) => updateColumn(column.id, { minWidth: parseInt(e.target.value) || 120 })}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="Ancho"
                    min="80"
                    max="500"
                  />

                  <button
                    onClick={() => removeColumn(column.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    disabled={localColumnConfigs.length <= 1}
                    title="Eliminar columna"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formula Helper */}
        {showFormulaHelper && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-medium text-blue-800 mb-3">🧮 Guía de Fórmulas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Funciones Básicas:</h4>
                <ul className="space-y-1 text-blue-600">
                  <li><code>=SUM(10,20,30)</code> → Suma números</li>
                  <li><code>=MUL(5,3)</code> → Multiplica números</li>
                  <li><code>=DIV(15,3)</code> → Divide números</li>
                  <li><code>=SUB(20,5)</code> → Resta números</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Referencias de Celdas:</h4>
                <ul className="space-y-1 text-blue-600">
                  <li><code>=1.COL_C+2.COL_C</code> → Suma valores de celdas</li>
                  <li><code>=5+3*2</code> → Operaciones matemáticas</li>
                  <li><code>=SUM(1.COL_C,2.COL_D)</code> → Combinar funciones</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-3">
              💡 Tip: Las referencias usan el formato FILA.COLUMNA (ej: 1.COL_A para la fila 1, columna A)
            </p>
          </div>
        )}

        {/* Spreadsheet */}
        <div className="flex-1 p-2 overflow-hidden">
          <div className="h-full border border-gray-200 rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg mb-2">Cargando datos...</p>
                  <p className="text-sm">Sincronizando con el sistema</p>
                </div>
              </div>
            ) : columns.length > 0 && localData.length > 0 ? (
              <div className="h-full">
                <DataSheetGrid
                  value={localData}
                  onChange={handleSpreadsheetChange}
                  columns={columns}
                  createRow={createRow}
                  duplicateRow={duplicateRow}
                  lockRows={false}
                  height={window.innerHeight - 160}
                  autoAddRow={true}
                  addRowsComponent={false}
                />
                {/* Fila de agregados fija al fondo */}
                <div className="w-full border-t border-gray-200 bg-gray-50 sticky bottom-0">
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${localColumnConfigs.length}, minmax(120px, 1fr))` }}>
                    {localColumnConfigs.map((col) => (
                      <div key={`agg_${col.id}`} className="flex items-center justify-between px-2 py-1 text-xs">
                        {['integer', 'number', 'float'].includes(col.type) ? (
                          <select
                            value={columnAggregations[col.id] || 'none'}
                            onChange={(e) => setColumnAggregations(prev => ({ ...prev, [col.id]: e.target.value as any }))}
                            className="border border-gray-300 rounded px-1 py-0.5 text-gray-700"
                          >
                            <option value="none">—</option>
                            <option value="sum">Σ</option>
                            <option value="avg">AVG</option>
                            <option value="median">MED</option>
                          </select>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        <span className="ml-2 font-medium text-gray-800 truncate">
                          {computeAggregationValue(col.id)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Inicializando spreadsheet...</p>
                  <p className="text-sm">Preparando el grid de datos</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con información */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600">
              💡 Usa Ctrl+C/V para copiar/pegar • Tab para navegar • Enter para nueva fila
            </div>
            <div className="text-xs text-gray-500">
              {localData.length} filas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetPanel; 