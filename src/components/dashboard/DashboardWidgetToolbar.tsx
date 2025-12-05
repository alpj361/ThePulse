import { useState } from 'react';
import { BarChart3, Smile, Type, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import type { ChartWidget } from '../../stores/dashboardStore';

interface DashboardWidgetToolbarProps {
  savedCharts: ChartWidget[];
  onAddChart: (chart: ChartWidget) => void;
  onAddEmoji: (emoji: string, size: 'small' | 'medium' | 'large') => void;
  onAddText: (text: string) => void;
}

export function DashboardWidgetToolbar({
  savedCharts,
  onAddChart,
  onAddEmoji,
  onAddText
}: DashboardWidgetToolbarProps) {
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
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'charts'
            ? 'text-purple-600 border-b-2 border-purple-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Gráficos
        </button>
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'emoji'
            ? 'text-purple-600 border-b-2 border-purple-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Smile className="h-4 w-4 inline mr-2" />
          Emojis
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'text'
            ? 'text-purple-600 border-b-2 border-purple-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Type className="h-4 w-4 inline mr-2" />
          Texto
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'charts' && (
          <div className="space-y-3">
            {savedCharts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay gráficos guardados</p>
                <p className="text-xs mt-1">Guarda visualizaciones desde el chat</p>
              </div>
            ) : (
              savedCharts.map((chart) => (
                <div
                  key={chart.id}
                  draggable={true}
                  onDragStart={(e) => {
                    // Set data for drop
                    e.dataTransfer.setData("widgetType", "chart");
                    e.dataTransfer.setData("widgetData", JSON.stringify(chart));
                    // Visual feedback
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                >
                  <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                    {chart.originalQuery}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(chart.timestamp).toLocaleDateString()}
                  </div>
                  {/* Hint overlay */}
                  <div className="absolute inset-0 bg-purple-50/0 group-hover:bg-purple-50/10 transition-colors rounded-lg" />
                  <div className="absolute top-2 right-2 text-gray-300 group-hover:text-purple-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  {/* Click to add fallback */}
                  <button
                    onClick={() => onAddChart(chart)}
                    className="absolute bottom-2 right-2 text-[10px] bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    + Agregar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'emoji' && (
          <div>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors mb-3"
            >
              Seleccionar Emoji
            </button>

            {showEmojiPicker && (
              <div className="mb-3">
                <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" />
              </div>
            )}

            <div className="text-xs text-gray-500 mt-4">
              <p>Haz click en un emoji para agregarlo a la pizarra</p>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escribe tu texto aquí..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3 min-h-[100px]"
            />
            <button
              onClick={handleAddText}
              disabled={!newText.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              Agregar Texto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


