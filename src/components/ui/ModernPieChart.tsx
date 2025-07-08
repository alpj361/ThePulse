import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ModernPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

// Custom Label adaptativo
const CustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, containerWidth } = props;
  
  // No mostrar label si el porcentaje es muy pequeño o si no hay espacio
  if (percent < 0.05 || !containerWidth || containerWidth < 300) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Tamaño de fuente adaptativo
  const fontSize = Math.max(9, Math.min(12, containerWidth * 0.025));
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight="600"
      style={{
        textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom Tooltip adaptativo
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl p-3 shadow-xl max-w-xs">
        <p className="text-gray-800 font-medium text-sm mb-2 truncate">{data.name}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-gray-700 text-sm">
            <span className="font-bold text-blue-600">{data.value}</span>
            <span className="text-gray-500 ml-1">({data.payload.percent ? (data.payload.percent * 100).toFixed(1) : 0}%)</span>
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const ModernPieChart: React.FC<ModernPieChartProps> = ({ 
  data, 
  height = 400, 
  showLegend = true,
  innerRadius: propInnerRadius,
  outerRadius: propOuterRadius
}) => {
  // Configuración adaptativa basada en datos y contenedor
  const dataLength = data.length;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isSmallContainer = height < 300;
  
  // Calcular configuración adaptativa
  const adaptiveConfig = {
    // Radios adaptativos
    outerRadius: propOuterRadius || Math.min(
      height * 0.35, 
      isMobile ? 70 : isSmallContainer ? 80 : 110
    ),
    
    // Inner radius basado en si hay leyenda y tamaño
    innerRadius: propInnerRadius || (
      showLegend && !isSmallContainer ? 
        Math.min(height * 0.15, 40) : 
        Math.min(height * 0.2, 50)
    ),
    
    // Posición del centro
    centerY: showLegend && !isSmallContainer ? "42%" : "50%",
    
    // Configuración de leyenda
    legendHeight: showLegend && !isSmallContainer ? Math.min(60, height * 0.15) : 0,
    
    // Márgenes adaptativos
    margins: {
      top: isSmallContainer ? 5 : 10,
      right: isSmallContainer ? 5 : 10,
      bottom: showLegend && !isSmallContainer ? Math.min(50, height * 0.12) : (isSmallContainer ? 5 : 10),
      left: isSmallContainer ? 5 : 10
    }
  };

  // Default colors optimized for white background
  const defaultColors = [
    'rgba(59, 130, 246, 0.85)',   // Blue
    'rgba(16, 185, 129, 0.85)',   // Green
    'rgba(245, 101, 101, 0.85)',  // Red
    'rgba(251, 191, 36, 0.85)',   // Yellow
    'rgba(139, 92, 246, 0.85)',   // Purple
    'rgba(236, 72, 153, 0.85)',   // Pink
    'rgba(251, 146, 60, 0.85)',   // Orange
    'rgba(14, 165, 233, 0.85)',   // Sky
    'rgba(34, 197, 94, 0.85)',    // Emerald
    'rgba(168, 85, 247, 0.85)',   // Violet
  ];

  // Add colors to data if not provided
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length]
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={adaptiveConfig.margins}>
          <defs>
            {/* Create gradients for each slice */}
            {dataWithColors.map((item, index) => (
              <radialGradient key={`gradient-${index}`} id={`pieGradient${index}`}>
                <stop offset="0%" stopColor={item.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.75} />
              </radialGradient>
            ))}
          </defs>
          
          <Pie
            data={dataWithColors}
            cx="50%"
            cy={adaptiveConfig.centerY}
            labelLine={false}
            label={(props) => <CustomLabel {...props} containerWidth={height} />}
            outerRadius={adaptiveConfig.outerRadius}
            innerRadius={adaptiveConfig.innerRadius}
            fill="#8884d8"
            dataKey="value"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
          >
            {dataWithColors.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#pieGradient${index})`}
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                }}
              />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && !isSmallContainer && (
            <Legend 
              verticalAlign="bottom" 
              height={adaptiveConfig.legendHeight}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '10px',
                fontSize: isMobile ? '9px' : '10px',
                color: 'rgba(55, 65, 81, 0.8)',
                lineHeight: '1.2'
              }}
              formatter={(value) => (
                <span style={{ 
                  fontSize: isMobile ? '9px' : '10px',
                  color: 'rgba(55, 65, 81, 0.8)' 
                }}>
                  {value.length > (isMobile ? 15 : 20) ? 
                    value.substring(0, isMobile ? 15 : 20) + '...' : 
                    value
                  }
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernPieChart; 