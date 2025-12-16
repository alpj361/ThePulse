import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Smile, Type, X, Sparkles, TrendingUp } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import type { ChartWidget } from '../../stores/dashboardStore';
import { useDashboardTheme } from '../../context/DashboardThemeContext';

interface DashboardWidgetToolbarProps {
  savedCharts: ChartWidget[];
  onAddChart: (chart: ChartWidget) => void;
  onAddEmoji: (emoji: string, size: 'small' | 'medium' | 'large') => void;
  onAddText: (text: string) => void;
  onAddCustomChart: () => void;
}

export function DashboardWidgetToolbar({
  savedCharts,
  onAddChart,
  onAddEmoji,
  onAddText,
  onAddCustomChart
}: DashboardWidgetToolbarProps) {
  const { theme } = useDashboardTheme();
  const [activeTab, setActiveTab] = useState<'charts' | 'emoji' | 'text'>('charts');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newText, setNewText] = useState('');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onAddEmoji(emojiData.emoji, 'medium');
    setShowEmojiPicker(false);
  };

  const handleAddText = () => {
    if (newText.trim()) {
      onAddText(newText.trim());
      setNewText('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: `1px solid ${theme.colors.border}40` }}>
        <button
          onClick={() => setActiveTab('charts')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
          style={{
            color: activeTab === 'charts' ? theme.colors.primary : theme.colors.textSecondary
          }}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Gráficos
          {activeTab === 'charts' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: theme.colors.primary }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('emoji')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
          style={{
            color: activeTab === 'emoji' ? theme.colors.primary : theme.colors.textSecondary
          }}
        >
          <Smile className="h-4 w-4 inline mr-2" />
          Emojis
          {activeTab === 'emoji' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: theme.colors.primary }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-all relative"
          style={{
            color: activeTab === 'text' ? theme.colors.primary : theme.colors.textSecondary
          }}
        >
          <Type className="h-4 w-4 inline mr-2" />
          Texto
          {activeTab === 'text' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: theme.colors.primary }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'charts' && (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddCustomChart}
              className="w-full py-3 px-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm font-medium mb-4 transition-all"
              style={{
                borderColor: `${theme.colors.primary}60`,
                color: theme.colors.primary,
                background: `${theme.colors.primary}05`
              }}
            >
              <Sparkles className="h-4 w-4" />
              Crear Gráfico Personalizado
            </motion.button>
            {savedCharts.length === 0 ? (
              <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay gráficos guardados</p>
                <p className="text-xs mt-1">Guarda visualizaciones desde el chat</p>
              </div>
            ) : (
              savedCharts.map((chart, index) => (
                <motion.div
                  key={chart.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("widgetType", "chart");
                    e.dataTransfer.setData("widgetData", JSON.stringify(chart));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="w-full text-left p-3 rounded-xl hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group relative"
                  style={{
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 10px 25px -5px ${theme.colors.primary}30`
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${theme.colors.primary}15` }}
                    >
                      <BarChart3 className="h-4 w-4" style={{ color: theme.colors.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1 line-clamp-2" style={{ color: theme.colors.text }}>
                        {chart.originalQuery}
                      </div>
                      <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {new Date(chart.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    onClick={() => onAddChart(chart)}
                    className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-md transition-all"
                    style={{
                      background: `${theme.colors.primary}20`,
                      color: theme.colors.primary
                    }}
                  >
                    + Agregar
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'emoji' && (
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full px-4 py-3 text-white rounded-xl font-medium transition-all mb-3"
              style={{ background: theme.colors.gradient }}
            >
              <Smile className="h-4 w-4 inline mr-2" />
              Seleccionar Emoji
            </motion.button>

            {showEmojiPicker && (
              <motion.div 
                className="mb-3 rounded-xl overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" />
              </motion.div>
            )}

            <div 
              className="text-xs mt-4 p-3 rounded-lg"
              style={{ 
                color: theme.colors.textSecondary,
                background: `${theme.colors.primary}05`
              }}
            >
              <p>💡 Haz click en un emoji para agregarlo a la pizarra</p>
              <p className="mt-1">Los emojis tienen animaciones interactivas estilo Apple</p>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escribe tu texto aquí..."
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 mb-3 min-h-[120px] transition-all"
              style={{
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                color: theme.colors.text,
                '::placeholder': { color: theme.colors.textSecondary }
              }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddText}
              disabled={!newText.trim()}
              className="w-full px-4 py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: newText.trim() ? theme.colors.gradient : theme.colors.border
              }}
            >
              <Type className="h-4 w-4 inline mr-2" />
              Agregar Texto
            </motion.button>

            <div 
              className="text-xs mt-4 p-3 rounded-lg"
              style={{ 
                color: theme.colors.textSecondary,
                background: `${theme.colors.primary}05`
              }}
            >
              <p>✏️ Edita el texto directamente en la pizarra haciendo doble click</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


