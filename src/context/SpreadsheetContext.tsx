import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SpreadsheetTweetData, SpreadsheetColumnConfig, TWEET_SPREADSHEET_COLUMNS } from '../utils/spreadsheetHelpers';

interface SpreadsheetContextType {
  // Estado del spreadsheet
  isOpen: boolean;
  data: Record<string, any>[];
  columnConfigs: SpreadsheetColumnConfig[];
  
  // Funciones de control
  openSpreadsheet: () => void;
  closeSpreadsheet: () => void;
  
  // Funciones para agregar datos
  addTweetData: (tweetData: SpreadsheetTweetData[], title?: string) => void;
  setSpreadsheetData: (data: Record<string, any>[], columns?: SpreadsheetColumnConfig[]) => void;
  clearSpreadsheet: () => void;
  
  // Utilidades
  lastAddedTitle?: string;
}

const SpreadsheetContext = createContext<SpreadsheetContextType | undefined>(undefined);

export const useSpreadsheet = (): SpreadsheetContextType => {
  const context = useContext(SpreadsheetContext);
  if (!context) {
    throw new Error('useSpreadsheet must be used within a SpreadsheetProvider');
  }
  return context;
};

interface SpreadsheetProviderProps {
  children: ReactNode;
}

export const SpreadsheetProvider: React.FC<SpreadsheetProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columnConfigs, setColumnConfigs] = useState<SpreadsheetColumnConfig[]>([
    { id: 'name', title: 'Nombre', type: 'text', minWidth: 200 },
    { id: 'description', title: 'Descripción', type: 'text', minWidth: 250 },
    { id: 'completed', title: 'Completado', type: 'checkbox', minWidth: 100 }
  ]);
  const [lastAddedTitle, setLastAddedTitle] = useState<string>();

  const openSpreadsheet = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSpreadsheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addTweetData = useCallback((tweetData: SpreadsheetTweetData[], title?: string) => {
    console.log(`📊 Agregando ${tweetData.length} tweets al spreadsheet`);
    
    // Convertir datos de tweets al formato del spreadsheet
    const spreadsheetData = tweetData.map((tweet, index) => ({
      id: tweet.id || `tweet_${index}`,
      contenido: tweet.contenido,
      sentimiento: tweet.sentimiento,
      es_promocional: tweet.es_promocional,
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      views: tweet.views,
      engagement_total: tweet.engagement_total,
      usuario: tweet.usuario,
      fecha: tweet.fecha,
      categoria: tweet.categoria,
      enlace: tweet.enlace
    }));

    // Configurar columnas y datos
    setColumnConfigs(TWEET_SPREADSHEET_COLUMNS);
    
    setData(prevData => {
      const hasTweetData = prevData.length > 0 && prevData[0].hasOwnProperty('contenido');
      return hasTweetData ? [...prevData, ...spreadsheetData] : spreadsheetData;
    });

    // Guardar título y abrir panel
    if (title) {
      setLastAddedTitle(title);
    }
    setIsOpen(true);
    
    console.log(`✅ Spreadsheet abierto`);
  }, []);

  const setSpreadsheetData = useCallback((newData: Record<string, any>[], columns?: SpreadsheetColumnConfig[]) => {
    setData(newData);
    if (columns) {
      setColumnConfigs(columns);
    }
  }, []);

  const clearSpreadsheet = useCallback(() => {
    const shouldClear = window.confirm('¿Estás seguro de que quieres limpiar todos los datos del spreadsheet?');
    if (shouldClear) {
      setData([]);
      setLastAddedTitle(undefined);
    }
  }, []);

  const value: SpreadsheetContextType = {
    isOpen,
    data,
    columnConfigs,
    openSpreadsheet,
    closeSpreadsheet,
    addTweetData,
    setSpreadsheetData,
    clearSpreadsheet,
    lastAddedTitle
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  );
};

export default SpreadsheetContext; 