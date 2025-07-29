import React from 'react';
import { FaTable } from 'react-icons/fa';

interface SpreadsheetFloatingButtonProps {
  onClick: () => void;
}

const SpreadsheetFloatingButton: React.FC<SpreadsheetFloatingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      title="Abrir Spreadsheet Interno"
    >
      <FaTable size={20} className="group-hover:scale-110 transition-transform" />
      
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Spreadsheet Interno
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
      </div>
    </button>
  );
};

export default SpreadsheetFloatingButton; 