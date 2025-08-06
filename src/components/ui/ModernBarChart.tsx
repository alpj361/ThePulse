import React, { useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

interface ModernBarChartProps {
  data: Array<{
    name: string;
    value: number;
    category?: string;
  }>;
  height?: number;
  gradient?: boolean;
  glassmorphism?: boolean;
  darkMode?: boolean;
}

// Custom Bar Shape Component for white background
const GlassBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  
  return (
    <g>
      {/* Main bar with glassmorphism effect for white background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={Math.min(8, width * 0.2)}
        ry={Math.min(8, width * 0.2)}
        style={{
          filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.15))',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      />
      {/* Highlight effect */}
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(width - 4, 0)}
        height={Math.max(height * 0.3, 4)}
        fill="rgba(255,255,255,0.6)"
        rx={Math.min(6, width * 0.15)}
        ry={Math.min(6, width * 0.15)}
      />
    </g>
  );
};



// Custom Label for white background - adaptativo
const CustomLabel = (props: any) => {
  const { x, y, width, value, height } = props;
  
  // Solo mostrar label si hay espacio suficiente
  if (width < 30 || height < 25) return null;
  
  const fontSize = Math.max(9, Math.min(12, width * 0.2));
  
  return (
    <text 
      x={x + width / 2} 
      y={y - 6} 
      fill="rgba(55, 65, 81, 0.8)" 
      textAnchor="middle" 
      fontSize={fontSize}
      fontWeight="500"
    >
      {value}
    </text>
  );
};

const ModernBarChart: React.FC<ModernBarChartProps> = ({ 
  data, 
  height = 400, 
  gradient = true, 
  glassmorphism = true,
  darkMode = false
}) => {
  // Calcular configuración adaptativa basada en datos
  // ☕ Buy Me A Coffee button
  const buyMeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buyMeRef.current && !buyMeRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
      script.setAttribute('data-name', 'bmc-button');
      script.setAttribute('data-slug', 'pulsejornal');
      script.setAttribute('data-color', '#5F7FFF');
      script.setAttribute('data-emoji', '☕');
      script.setAttribute('data-font', 'Lato');
      script.setAttribute('data-text', 'Buy me a coffee');
      script.setAttribute('data-outline-color', '#000000');
      script.setAttribute('data-font-color', '#ffffff');
      script.setAttribute('data-coffee-color', '#FFDD00');
      script.async = true;
      buyMeRef.current.appendChild(script);
    }
  }, []);

  // Calcular configuración adaptativa basada en datos
  const dataLength = data.length;
  const maxLabelLength = Math.max(...data.map(item => item.name.length));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Configuración adaptativa
  const adaptiveConfig = {
    // Márgenes dinámicos basados en contenido
    margins: {
      top: height < 300 ? 15 : 20,
      right: Math.max(20, Math.min(40, height * 0.1)),
      left: Math.max(15, Math.min(30, height * 0.08)),
      bottom: Math.max(40, Math.min(80, maxLabelLength * (isMobile ? 3 : 2.5) + 20))
    },
    
    // Tamaño de fuente adaptativo
    fontSize: isMobile ? 
      Math.max(8, Math.min(10, height * 0.025)) : 
      Math.max(9, Math.min(12, height * 0.03)),
    
    // Configuración de barras
    barCategoryGap: dataLength > 8 ? "10%" : "20%",
    maxBarSize: Math.max(20, Math.min(80, (height * 0.15) / Math.max(1, dataLength * 0.1))),
    
    // Rotación de etiquetas
    labelAngle: maxLabelLength > 8 || dataLength > 6 ? -35 : 0,
    labelHeight: maxLabelLength > 8 || dataLength > 6 ? 
      Math.max(50, maxLabelLength * 2.5) : 30
  };

  // Generate colors based on values - optimized for white background
  const getBarColor = (value: number, index: number) => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',  // Blue
      'rgba(16, 185, 129, 0.8)',  // Green  
      'rgba(245, 101, 101, 0.8)', // Red
      'rgba(251, 191, 36, 0.8)',  // Yellow
      'rgba(139, 92, 246, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
    ];
    return colors[index % colors.length];
  };

  // Get gradient colors for bars
  const getGradientColors = (index: number) => {
    const gradientColors = [
      { start: '59, 130, 246', end: '59, 130, 246' },    // Blue
      { start: '16, 185, 129', end: '16, 185, 129' },    // Green
      { start: '245, 101, 101', end: '245, 101, 101' },  // Red
      { start: '251, 191, 36', end: '251, 191, 36' },    // Yellow
      { start: '139, 92, 246', end: '139, 92, 246' },    // Purple
      { start: '236, 72, 153', end: '236, 72, 153' },    // Pink
    ];
    return gradientColors[(index - 1) % gradientColors.length];
  };

  // Smart label formatter - extracts key information instead of truncating
  const smartLabelFormatter = (value: string) => {
    if (!value) return '';
    
    // Define max characters based on screen size
    const maxChars = isMobile ? 12 : 16;
    
    // If already short enough, return as-is
    if (value.length <= maxChars) return value;
    
    // Smart keyword extraction for common patterns
    
    // Remove common prefixes that add noise
    let cleaned = value.replace(/^(.*?)\s*-\s*/, ''); // Remove "Question - " pattern
    
    // Extract key political/economic terms
    const politicalTerms = ['política', 'político', 'gobierno', 'elecciones', 'partido', 'congreso', 'presidente'];
    const economicTerms = ['economía', 'económico', 'inversión', 'financiero', 'comercio', 'empleo', 'desarrollo'];
    const socialTerms = ['educación', 'salud', 'cultura', 'social', 'comunidad', 'familia'];
    const geoTerms = ['guatemala', 'zona metro', 'occidente', 'oriente', 'norte', 'capital'];
    
    // Check for abbreviated forms
    if (cleaned.toLowerCase().includes('política') || politicalTerms.some(term => cleaned.toLowerCase().includes(term))) {
      return 'Política';
    }
    if (cleaned.toLowerCase().includes('económ') || economicTerms.some(term => cleaned.toLowerCase().includes(term))) {
      return 'Economía';
    }
    if (cleaned.toLowerCase().includes('internacional') || cleaned.toLowerCase().includes('exterior')) {
      return 'Internacional';
    }
    if (cleaned.toLowerCase().includes('tecnolog') || cleaned.toLowerCase().includes('digital')) {
      return 'Tecnología';
    }
    if (socialTerms.some(term => cleaned.toLowerCase().includes(term))) {
      return 'Social';
    }
    
    // Geographic abbreviations
    if (cleaned.toLowerCase().includes('guatemala') && cleaned.toLowerCase().includes('ciudad')) {
      return 'Guatemala Capital';
    }
    if (cleaned.toLowerCase().includes('zona metro')) {
      return 'Zona Metro';
    }
    if (geoTerms.some(term => cleaned.toLowerCase().includes(term))) {
      const foundTerm = geoTerms.find(term => cleaned.toLowerCase().includes(term));
      return foundTerm!.charAt(0).toUpperCase() + foundTerm!.slice(1);
    }
    
    // For news titles and other long content, extract first meaningful words
    const words = cleaned.split(' ').filter(word => word.length > 2);
    if (words.length >= 2) {
      // Take first 2-3 meaningful words
      const keyWords = words.slice(0, 3).join(' ');
      if (keyWords.length <= maxChars) {
        return keyWords;
      }
      // Try with just 2 words
      const twoWords = words.slice(0, 2).join(' ');
      if (twoWords.length <= maxChars) {
        return twoWords;
      }
      // Fall back to first word if still too long
      return words[0].length <= maxChars ? words[0] : words[0].substring(0, maxChars - 3) + '...';
    }
    
    // Last resort: smart truncation at word boundaries
    if (cleaned.length > maxChars) {
      const truncated = cleaned.substring(0, maxChars);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxChars * 0.7) { // Only use word boundary if it's not too early
        return truncated.substring(0, lastSpace) + '...';
      }
      return truncated + '...';
    }
    
    return cleaned;
  };

  // Enhanced tooltip component that shows full labels
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the original data item to get full untruncated label
      const originalItem = data.find((item: any) => smartLabelFormatter(item.name) === label || item.name === label);
      const fullLabel = originalItem ? originalItem.name : label;
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl p-3 shadow-xl">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {fullLabel}
          </p>
          <p className="text-lg font-bold text-blue-600">
            {payload[0].value}
          </p>
          {originalItem && originalItem.name !== label && (
            <p className="text-xs text-gray-500 mt-1">
              Etiqueta: {label}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={adaptiveConfig.margins}
          barCategoryGap={adaptiveConfig.barCategoryGap}
          maxBarSize={adaptiveConfig.maxBarSize}
        >
          <defs>
            {/* Create 6 different gradients for bars */}
            {[1,2,3,4,5,6].map(i => (
              <linearGradient key={`barGradient${i}`} id={`barGradient${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`rgba(${getGradientColors(i).start}, 0.9)`} />
                <stop offset="100%" stopColor={`rgba(${getGradientColors(i).end}, 0.7)`} />
              </linearGradient>
            ))}
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
              fill: 'rgba(55, 65, 81, 0.8)',
              width: 100 
            }}
            tickFormatter={smartLabelFormatter}
          />
          
          <YAxis 
            stroke="rgba(55, 65, 81, 0.7)"
            fontSize={adaptiveConfig.fontSize}
            tickLine={false}
            axisLine={false}
            width={Math.max(35, adaptiveConfig.margins.left + 15)}
            tick={{ fontSize: adaptiveConfig.fontSize, fill: 'rgba(55, 65, 81, 0.8)' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            dataKey="value" 
            radius={[
              Math.min(8, adaptiveConfig.maxBarSize * 0.2), 
              Math.min(8, adaptiveConfig.maxBarSize * 0.2), 
              0, 
              0
            ]}
            shape={glassmorphism ? <GlassBar /> : undefined}
          >
            {/* Solo mostrar labels si hay espacio */}
            {height > 250 && adaptiveConfig.maxBarSize > 25 && (
              <LabelList content={<CustomLabel />} />
            )}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={gradient ? `url(#barGradient${(index % 6) + 1})` : getBarColor(entry.value, index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div ref={buyMeRef} className="flex justify-center mt-4"></div>
    </div>
  );
};

export default ModernBarChart; 