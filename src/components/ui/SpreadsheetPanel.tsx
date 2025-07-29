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
import { FaPlus, FaTrash, FaDownload, FaUpload, FaSave, FaUndo, FaCog, FaEdit } from 'react-icons/fa';
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
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos cuando se abre el panel (UNA SOLA VEZ)
  useEffect(() => {
    if (isOpen && localData.length === 0) {
      console.log('📊 Panel: Inicializando...');
      setIsLoading(true);
      
      const loadTimeout = setTimeout(() => {
        // Capturar los datos del contexto en el momento de la carga
        const currentContextData = contextData;
        const currentContextColumns = contextColumns;
        
        if (currentContextData.length > 0) {
          console.log(`✅ Panel: Cargados ${currentContextData.length} tweets`);
          setLocalData([...currentContextData]);
          setLocalColumnConfigs([...currentContextColumns]);
        } else {
          console.log('📝 Panel: Datos de ejemplo');
          setLocalData([{
            id: '1',
            name: 'Tarea de ejemplo 1',
            description: 'Esta es una descripción de ejemplo',
            completed: false,
            priority: 3,
            dueDate: new Date('2024-12-31'),
            category: 'Trabajo',
            notes: 'Notas adicionales'
          }]);
          
          setLocalColumnConfigs([
            { id: 'name', title: 'Nombre', type: 'text', minWidth: 200 },
            { id: 'description', title: 'Descripción', type: 'text', minWidth: 250 },
            { id: 'completed', title: 'Completado', type: 'checkbox', minWidth: 100 },
            { id: 'priority', title: 'Prioridad', type: 'integer', minWidth: 100 },
            { id: 'dueDate', title: 'Fecha límite', type: 'date', minWidth: 150 },
            { id: 'category', title: 'Categoría', type: 'text', minWidth: 120 },
            { id: 'notes', title: 'Notas', type: 'text', minWidth: 200 }
          ]);
        }
        setIsLoading(false);
      }, 50);
      
      return () => clearTimeout(loadTimeout);
    }
  }, [isOpen]); // Solo depende de isOpen

  // Limpiar datos cuando se cierra el panel
  useEffect(() => {
    if (!isOpen) {
      setLocalData([]);
      setLocalColumnConfigs([]);
      setIsLoading(false);
      setShowColumnEditor(false);
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
        case 'integer':
        case 'number':
        case 'float':
          newRow[config.id] = 0;
          break;
        case 'date':
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
  const addColumn = useCallback(() => {
    const newColumn: ColumnConfig = {
      id: `col_${genId()}`,
      title: 'Nueva Columna',
      type: 'text',
      minWidth: 150
    };
    setLocalColumnConfigs(prev => [...prev, newColumn]);
    
    // Agregar la nueva columna a todos los datos existentes
    setLocalData(prev => prev.map(row => ({
      ...row,
      [newColumn.id]: ''
    })));
  }, [genId]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-6xl h-full shadow-xl flex flex-col">
                       {/* Header */}
               <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                 <div className="flex items-center space-x-2">
                   <h2 className="text-xl font-semibold text-gray-800">Spreadsheet Interno</h2>
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
                         <button
               onClick={addRow}
               disabled={isLoading}
               className={`p-2 rounded-md transition-colors ${
                 isLoading 
                   ? 'text-gray-400 cursor-not-allowed' 
                   : 'text-green-600 hover:text-green-800 hover:bg-green-50'
               }`}
               title="Agregar fila"
             >
               <FaPlus size={20} />
             </button>
             
             <button
               onClick={removeLastRow}
               disabled={isLoading || localData.length <= 1}
               className={`p-2 rounded-md transition-colors ${
                 isLoading || localData.length <= 1
                   ? 'text-gray-400 cursor-not-allowed' 
                   : 'text-red-600 hover:text-red-800 hover:bg-red-50'
               }`}
               title="Eliminar última fila"
             >
               <FaTrash size={20} />
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
               title="Limpiar datos"
             >
               <FaUndo size={20} />
             </button>
             
             <div className="border-l border-gray-300 mx-2 h-6"></div>
             
             <button
               onClick={() => setShowColumnEditor(!showColumnEditor)}
               disabled={isLoading}
               className={`p-2 transition-colors rounded-md ${
                 isLoading 
                   ? 'text-gray-400 cursor-not-allowed'
                   : showColumnEditor 
                     ? 'text-blue-800 bg-blue-100' 
                     : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
               }`}
               title="Configurar columnas"
             >
               <FaCog size={20} />
             </button>
             
             <button
               onClick={addColumn}
               disabled={isLoading}
               className={`p-2 rounded-md transition-colors ${
                 isLoading 
                   ? 'text-gray-400 cursor-not-allowed' 
                   : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
               }`}
               title="Agregar columna"
             >
               <FaPlus size={20} />
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
               {localColumnConfigs.map((column, index) => (
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

                       {/* Spreadsheet */}
               <div className="flex-1 p-4 overflow-hidden">
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
                         onChange={(newData: any) => setLocalData(newData)}
                         columns={columns}
                         createRow={createRow}
                         duplicateRow={duplicateRow}
                         lockRows={false}
                         height={window.innerHeight - 200}
                         autoAddRow={false}
                         addRowsComponent={false}
                       />
                     </div>
                   ) : (
                     <div className="flex items-center justify-center h-full text-gray-500">
                       <div className="text-center">
                         <p className="text-lg mb-2">No hay datos para mostrar</p>
                         <p className="text-sm">Agrega datos desde las cards de Recent Activity para comenzar</p>
                       </div>
                     </div>
                   )}
                 </div>
               </div>

        {/* Footer con información */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              💡 Consejos: Ctrl+C/V para copiar/pegar • Tab para navegar • Enter para nueva fila
            </p>
            <div className="text-sm text-gray-500">
              {localData.length} filas de datos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetPanel; 