import React from 'react';
import { motion } from 'framer-motion';

export type PartyType =
  | 'far-left'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'right'
  | 'far-right'
  | 'independent'
  | 'vacant';

interface ParliamentSeatProps {
  id: string;
  party: PartyType;
  isSelected: boolean;
  onClick: () => void;
  position: { x: number; y: number };
  seatNumber?: string;
  memberName?: string;
}

const partyColors: Record<PartyType, { bg: string; hover: string; border: string }> = {
  'far-left': { bg: '#991B1B', hover: '#B91C1C', border: '#7F1D1D' },
  'center-left': { bg: '#EA580C', hover: '#F97316', border: '#C2410C' },
  center: { bg: '#F59E0B', hover: '#FBBF24', border: '#D97706' },
  'center-right': { bg: '#3B82F6', hover: '#60A5FA', border: '#2563EB' },
  right: { bg: '#1D4ED8', hover: '#2563EB', border: '#1E40AF' },
  'far-right': { bg: '#1E3A8A', hover: '#1E40AF', border: '#1E3A8A' },
  independent: { bg: '#6B7280', hover: '#9CA3AF', border: '#4B5563' },
  vacant: { bg: '#D1D5DB', hover: '#E5E7EB', border: '#9CA3AF' },
};

const partyLabels: Record<PartyType, string> = {
  'far-left': 'Extrema Izquierda',
  'center-left': 'Centro Izquierda',
  center: 'Centro',
  'center-right': 'Centro Derecha',
  right: 'Derecha',
  'far-right': 'Extrema Derecha',
  independent: 'Independiente',
  vacant: 'Vacante',
};

export const ParliamentSeat: React.FC<ParliamentSeatProps> = ({
  id,
  party,
  isSelected,
  onClick,
  position,
  seatNumber,
  memberName
}) => {
  const colors = partyColors[party];
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.3,
        delay: parseInt(id.split('-')[1] || '0') * 0.005
      }}
      whileHover={{ scale: 1.5, zIndex: 10 }}
      whileTap={{ scale: 1.2 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Escaño principal */}
      <div
        className="rounded-full transition-all duration-200 shadow-sm"
        style={{
          width: '10px',  // Más pequeño para coincidir con tu imagen
          height: '10px', // Más pequeño para coincidir con tu imagen
          backgroundColor: isHovered ? colors.hover : colors.bg,
          border: isSelected
            ? '2px solid #000'  // Border más fino cuando seleccionado
            : `1px solid ${colors.border}`,
          boxShadow: isSelected
            ? '0 0 8px rgba(0,0,0,0.4)'
            : '0 1px 2px rgba(0,0,0,0.15)',
        }}
      />

      {/* Tooltip en hover */}
      {isHovered && (
        <motion.div
          className="absolute bottom-full left-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-20"
          style={{ transform: 'translateX(-50%)' }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-semibold">
            Escaño {seatNumber || id.split('-')[1]}
          </div>
          <div className="text-gray-300">
            {partyLabels[party]}
          </div>
          {memberName && (
            <div className="text-gray-400 text-xs">
              {memberName}
            </div>
          )}
          {/* Flecha del tooltip */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #1F2937'
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ParliamentSeat;