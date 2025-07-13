import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';

interface SentimentAreaChartProps {
  data: Array<{
    fecha: string;
    positivo: number;
    neutral: number;
    negativo: number;
  }>;
  height?: number;
  title?: string;
  showGrid?: boolean;
  emptyMessage?: string;
}

/**
 * Componente especializado para visualizar evolución de sentimiento con áreas apiladas
 */
const SentimentAreaChart: React.FC<SentimentAreaChartProps> = ({
  data,
  height = 350,
  title = "Evolución del Sentimiento",
  showGrid = true,
  emptyMessage = 'No hay datos de sentimiento disponibles'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Validar que hay datos para mostrar
  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'grey.300',
        borderRadius: 1,
        backgroundColor: 'rgba(0,0,0,0.02)'
      }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // Calcular márgenes basados en el tamaño de la pantalla
  const chartMargins = {
    top: 20,
    right: isMobile ? 10 : 30,
    left: isMobile ? 10 : 20,
    bottom: isMobile ? 60 : 40
  };

  // Customizar tooltip para sentimiento
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <Box sx={{ 
          backgroundColor: 'background.paper', 
          p: 2, 
          border: '1px solid', 
          borderColor: 'grey.300', 
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: 200
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: entry.color,
                  borderRadius: '50%' 
                }} />
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {entry.name}:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {entry.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>
                  ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                </Typography>
              </Box>
            </Box>
          ))}
          <Box sx={{ borderTop: '1px solid', borderColor: 'grey.200', pt: 1, mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>
              Total: {total} menciones
            </Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height, mb: 2 }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={chartMargins}
          stackOffset="expand" // Para mostrar porcentajes apilados
        >
          <defs>
            {/* Gradientes para cada sentimiento */}
            <linearGradient id="positivoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6B7280" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6B7280" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="negativoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              opacity={0.3}
              stroke="#E5E7EB"
            />
          )}
          
          <XAxis 
            dataKey="fecha" 
            angle={isMobile ? -45 : 0} 
            textAnchor={isMobile ? "end" : "middle"} 
            tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
            height={isMobile ? 60 : 40}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            width={35}
            tickMargin={8}
            tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value * 100)}%`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value) => (
              <span style={{ 
                fontSize: '13px', 
                color: '#374151',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}>
                {value}
              </span>
            )}
          />
          
          {/* Áreas apiladas para cada sentimiento */}
          <Area 
            type="monotone" 
            dataKey="positivo" 
            name="Positivo"
            stackId="1"
            stroke="#10B981" 
            strokeWidth={2}
            fill="url(#positivoGradient)"
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
          
          <Area 
            type="monotone" 
            dataKey="neutral" 
            name="Neutral"
            stackId="1"
            stroke="#6B7280" 
            strokeWidth={2}
            fill="url(#neutralGradient)"
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
          
          <Area 
            type="monotone" 
            dataKey="negativo" 
            name="Negativo"
            stackId="1"
            stroke="#EF4444" 
            strokeWidth={2}
            fill="url(#negativoGradient)"
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SentimentAreaChart; 