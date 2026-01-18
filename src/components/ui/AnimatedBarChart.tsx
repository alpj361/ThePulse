import React from 'react';
import { motion } from 'framer-motion';

interface CategoryData {
  category: string;
  percentage: number;
  count: number;
}

interface AnimatedBarChartProps {
  data: CategoryData[];
}

const categoryColors: Record<string, string> = {
  'General': 'bg-gradient-to-t from-blue-500 to-blue-400',
  'Deportes': 'bg-gradient-to-t from-purple-500 to-purple-400',
  'Política': 'bg-gradient-to-t from-red-500 to-red-400',
  'Tecnología': 'bg-gradient-to-t from-green-500 to-green-400',
  'Economía': 'bg-gradient-to-t from-yellow-500 to-yellow-400',
  'Cultura': 'bg-gradient-to-t from-pink-500 to-pink-400',
  'Ciencia': 'bg-gradient-to-t from-teal-500 to-teal-400',
  'Entretenimiento': 'bg-gradient-to-t from-orange-500 to-orange-400',
};

export function AnimatedBarChart({ data }: AnimatedBarChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const bars = data.map(item => ({
    label: item.category,
    value: Math.round(item.percentage),
    color: categoryColors[item.category] || 'bg-gradient-to-t from-gray-500 to-gray-400'
  }));

  const maxValue = Math.max(...bars.map(b => b.value));

  const gapSize = bars.length > 4 ? 'gap-4' : 'gap-6';
  const maxBarWidth = bars.length > 6 ? '90px' : bars.length > 4 ? '110px' : '130px';

  return (
    <div className={`w-full flex items-end justify-center ${gapSize} px-6 py-6`} style={{ height: '340px' }}>
      {bars.map((bar, index) => (
        <div key={bar.label} className="flex flex-col items-center gap-3" style={{ flex: 1, maxWidth: maxBarWidth }}>
          {/* Bar */}
          <div className="relative w-full flex items-end justify-center" style={{ height: '260px' }}>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${(bar.value / maxValue) * 100}%`, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className={`w-full rounded-t-xl ${bar.color} shadow-md relative`}
            >
              {/* Value label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 + 0.6 }}
                className="absolute -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              >
                <span className="text-xl font-bold text-gray-800">{bar.value}%</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.4 }}
            className="text-center w-full"
          >
            <span className="text-sm font-semibold text-gray-800 block truncate px-1">{bar.label}</span>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
