import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SentimentData {
  tiempo: string;
  positivo: number;
  neutral: number;
  negativo: number;
  fecha?: string;
  evento?: string;
}

interface SentimentAreaChartProps {
  data: SentimentData[];
  height?: number;
  title?: string;
  showEvents?: boolean;
  contextType?: 'politica' | 'economia' | 'social' | 'tecnologia' | 'general';
}

const SentimentAreaChart: React.FC<SentimentAreaChartProps> = ({
  data,
  height = 320,
  title = "Evolución del Sentimiento",
  showEvents = true,
  contextType = 'general'
}) => {
  // Configuración de colores según contexto
  const getContextColors = () => {
    const baseColors = {
      politica: {
        positivo: { start: 'rgba(34, 197, 94, 0.8)', end: 'rgba(34, 197, 94, 0.2)' },
        neutral: { start: 'rgba(156, 163, 175, 0.6)', end: 'rgba(156, 163, 175, 0.1)' },
        negativo: { start: 'rgba(239, 68, 68, 0.8)', end: 'rgba(239, 68, 68, 0.2)' }
      },
      economia: {
        positivo: { start: 'rgba(16, 185, 129, 0.8)', end: 'rgba(16, 185, 129, 0.2)' },
        neutral: { start: 'rgba(107, 114, 128, 0.6)', end: 'rgba(107, 114, 128, 0.1)' },
        negativo: { start: 'rgba(220, 38, 38, 0.8)', end: 'rgba(220, 38, 38, 0.2)' }
      },
             social: {
         positivo: { start: 'rgba(59, 130, 246, 0.8)', end: 'rgba(59, 130, 246, 0.2)' },
         neutral: { start: 'rgba(156, 163, 175, 0.6)', end: 'rgba(156, 163, 175, 0.1)' },
         negativo: { start: 'rgba(251, 146, 60, 0.8)', end: 'rgba(251, 146, 60, 0.2)' }
       },
       tecnologia: {
         positivo: { start: 'rgba(139, 92, 246, 0.8)', end: 'rgba(139, 92, 246, 0.2)' },
         neutral: { start: 'rgba(156, 163, 175, 0.6)', end: 'rgba(156, 163, 175, 0.1)' },
         negativo: { start: 'rgba(245, 101, 101, 0.8)', end: 'rgba(245, 101, 101, 0.2)' }
       },
       general: {
        positivo: { start: 'rgba(34, 197, 94, 0.8)', end: 'rgba(34, 197, 94, 0.2)' },
        neutral: { start: 'rgba(156, 163, 175, 0.6)', end: 'rgba(156, 163, 175, 0.1)' },
        negativo: { start: 'rgba(239, 68, 68, 0.8)', end: 'rgba(239, 68, 68, 0.2)' }
      }
    };
    return baseColors[contextType] || baseColors.general;
  };

  const colors = getContextColors();

  // Tooltip personalizado con información rica
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.positivo + data.neutral + data.negativo;
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-xl max-w-xs">
          <h4 className="font-semibold text-gray-900 mb-2">{label}</h4>
          {data.evento && (
            <p className="text-xs text-blue-600 mb-2 font-medium">📍 {data.evento}</p>
          )}
          
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              const sentimentIcons = {
                positivo: '😊',
                neutral: '😐', 
                negativo: '😞'
              };
              const icon = sentimentIcons[entry.dataKey as keyof typeof sentimentIcons] || '📊';
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-sm capitalize text-gray-700">{entry.dataKey}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm" style={{ color: entry.color }}>
                      {entry.value}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {data.fecha && (
            <p className="text-xs text-gray-400 mt-2 border-t pt-2">
              📅 {data.fecha}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Encontrar eventos importantes para mostrar líneas de referencia
  const eventosImportantes = data.filter(item => item.evento);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">
          Análisis temporal de reacciones emocionales
        </p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="positivoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.positivo.start} />
                <stop offset="95%" stopColor={colors.positivo.end} />
              </linearGradient>
              <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.neutral.start} />
                <stop offset="95%" stopColor={colors.neutral.end} />
              </linearGradient>
              <linearGradient id="negativoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.negativo.start} />
                <stop offset="95%" stopColor={colors.negativo.end} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis 
              dataKey="tiempo" 
              stroke="rgba(55, 65, 81, 0.7)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(55, 65, 81, 0.7)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Líneas de referencia para eventos importantes */}
            {showEvents && eventosImportantes.map((evento, index) => (
              <ReferenceLine 
                key={index}
                x={evento.tiempo} 
                stroke="#6366f1" 
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            ))}
            
            <Area
              type="monotone"
              dataKey="negativo"
              stackId="1"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#negativoGradient)"
            />
            <Area
              type="monotone"
              dataKey="neutral"
              stackId="1"
              stroke="#9ca3af"
              strokeWidth={2}
              fill="url(#neutralGradient)"
            />
            <Area
              type="monotone"
              dataKey="positivo"
              stackId="1"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#positivoGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Leyenda contextual */}
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">😊 Positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-sm text-gray-600">😐 Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">😞 Negativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAreaChart; 