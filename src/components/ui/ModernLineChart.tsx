import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
  Dot
} from 'recharts';

interface ModernLineChartProps {
  data: Array<{
    name: string;
    value: number;
    target?: number;
  }>;
  height?: number;
  showArea?: boolean;
  showTarget?: boolean;
  targetValue?: number;
  darkMode?: boolean;
}

// Custom Dot adaptativo
const CustomDot = (props: any) => {
  const { cx, cy, payload, containerWidth } = props;
  
  // Tamaño del dot basado en el tamaño del contenedor
  const dotSize = Math.max(3, Math.min(6, (containerWidth || 400) * 0.012));
  
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={dotSize}
      fill="rgba(59, 130, 246, 1)"
      stroke="rgba(255,255,255,0.9)"
      strokeWidth={2}
      style={{
        filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.3))'
      }}
    />
  );
};

// Custom Tooltip adaptativo
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl p-3 shadow-xl max-w-xs">
        <p className="text-gray-800 font-medium text-sm mb-2 truncate">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 text-sm">
                <span className="font-bold text-blue-600">{entry.value}</span>
                {entry.name && <span className="text-gray-500 ml-1">({entry.name})</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const ModernLineChart: React.FC<ModernLineChartProps> = ({ 
  data, 
  height = 400, 
  showArea = true, 
  showTarget = true,
  targetValue = 0,
  darkMode = false
}) => {
  // Configuración adaptativa basada en datos y contenedor
  const dataLength = data.length;
  const maxLabelLength = Math.max(...data.map(item => item.name.length));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isSmallContainer = height < 300;
  
  // Calculate average for target line
  const avgValue = targetValue || data.reduce((sum, item) => sum + item.value, 0) / data.length;

  // Configuración adaptativa
  const adaptiveConfig = {
    // Márgenes dinámicos
    margins: {
      top: isSmallContainer ? 15 : Math.max(25, height * 0.08),
      right: Math.max(20, Math.min(50, height * 0.12)),
      left: Math.max(20, Math.min(40, height * 0.1)),
      bottom: Math.max(30, Math.min(70, maxLabelLength * (isMobile ? 2.5 : 2) + 20))
    },
    
    // Tamaño de fuente adaptativo
    fontSize: isMobile ? 
      Math.max(8, Math.min(10, height * 0.025)) : 
      Math.max(9, Math.min(12, height * 0.03)),
    
    // Configuración de línea
    strokeWidth: Math.max(2, Math.min(4, height * 0.008)),
    
    // Configuración de área
    areaOpacity: isSmallContainer ? 0.15 : 0.2,
    
    // Rotación de etiquetas
    labelAngle: maxLabelLength > 6 || dataLength > 8 ? (isMobile ? -45 : -35) : 0,
    labelHeight: maxLabelLength > 6 || dataLength > 8 ? 
      Math.max(40, maxLabelLength * (isMobile ? 3 : 2.5)) : 
      Math.max(25, height * 0.08)
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={adaptiveConfig.margins}
        >
          <defs>
            {/* Area gradient for white background */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgba(59, 130, 246, ${adaptiveConfig.areaOpacity * 2})`} />
              <stop offset="50%" stopColor={`rgba(59, 130, 246, ${adaptiveConfig.areaOpacity})`} />
              <stop offset="100%" stopColor={`rgba(59, 130, 246, 0.05)`} />
            </linearGradient>
            
            {/* Line gradient for white background */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 1)" />
              <stop offset="50%" stopColor="rgba(16, 185, 129, 1)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 1)" />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="2 2" 
            stroke="rgba(0,0,0,0.1)" 
            horizontal={true}
            vertical={false}
          />
          
          <XAxis 
            dataKey="name" 
            stroke="rgba(55, 65, 81, 0.7)"
            fontSize={adaptiveConfig.fontSize}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={adaptiveConfig.labelAngle}
            textAnchor={adaptiveConfig.labelAngle !== 0 ? "end" : "middle"}
            height={adaptiveConfig.labelHeight}
            tick={{ 
              fontSize: adaptiveConfig.fontSize, 
              fill: 'rgba(55, 65, 81, 0.8)' 
            }}
            tickFormatter={(value) => {
              // Truncar etiquetas largas
              const maxChars = isMobile ? 10 : 12;
              return value.length > maxChars ? value.substring(0, maxChars) + '...' : value;
            }}
          />
          
          <YAxis 
            stroke="rgba(55, 65, 81, 0.7)"
            fontSize={adaptiveConfig.fontSize}
            tickLine={false}
            axisLine={false}
            width={Math.max(40, adaptiveConfig.margins.left + 20)}
            tick={{ fontSize: adaptiveConfig.fontSize, fill: 'rgba(55, 65, 81, 0.8)' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Target line */}
          {showTarget && !isSmallContainer && (
            <ReferenceLine 
              y={avgValue} 
              stroke="rgba(251, 146, 60, 0.8)" 
              strokeDasharray="5 5"
              strokeWidth={Math.max(1, adaptiveConfig.strokeWidth - 1)}
              label={{
                value: "Target",
                position: "top",
                fill: "rgba(251, 146, 60, 1)",
                fontSize: adaptiveConfig.fontSize,
                fontWeight: "bold"
              }}
            />
          )}
          
          {/* Area fill */}
          {showArea && (
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="url(#areaGradient)"
            />
          )}
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGradient)"
            strokeWidth={adaptiveConfig.strokeWidth}
            dot={(props) => <CustomDot {...props} containerWidth={height} />}
            activeDot={{
              r: Math.max(4, Math.min(8, height * 0.015)),
              stroke: 'rgba(255,255,255,0.9)',
              strokeWidth: 2,
              fill: 'rgba(59, 130, 246, 1)',
              style: {
                filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))'
              }
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernLineChart; 