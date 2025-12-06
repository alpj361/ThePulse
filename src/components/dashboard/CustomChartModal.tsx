import React, { useState, useEffect } from 'react';
import { X, BarChart, LineChart, PieChart, Activity } from 'lucide-react';
import { useSpreadsheet } from '../../context/SpreadsheetContext';

interface CustomChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddChart: (config: any) => void;
}

export function CustomChartModal({ isOpen, onClose, onAddChart }: CustomChartModalProps) {
    const { columnConfigs, data } = useSpreadsheet();

    const [title, setTitle] = useState('');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
    const [xAxis, setXAxis] = useState('');
    const [yAxis, setYAxis] = useState('');
    const [useLiveData, setUseLiveData] = useState(true);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setChartType('bar');
            setXAxis(columnConfigs.find(c => c.type === 'text' || c.type === 'date')?.id || '');
            setYAxis(columnConfigs.find(c => ['number', 'integer', 'float'].includes(c.type))?.id || '');
            setUseLiveData(true);
        }
    }, [isOpen, columnConfigs]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!xAxis || !yAxis) return;

        onAddChart({
            chartType,
            xAxis,
            yAxis,
            title: title || 'Nuevo Gráfico',
            useLiveData,
            snapshotData: useLiveData ? undefined : data
        });
        onClose();
    };

    const chartTypes = [
        { id: 'bar', label: 'Barras', icon: BarChart },
        { id: 'line', label: 'Línea', icon: LineChart },
        { id: 'area', label: 'Área', icon: Activity },
        { id: 'pie', label: 'Circular', icon: PieChart },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Crear Gráfico Personalizado</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Data Source Indicator */}
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mb-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Fuente de Datos</span>
                            <span className="text-xs text-purple-600">
                                {data.length} filas disponibles
                            </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Spreadsheet Interno
                        </div>
                        {data.length === 0 && (
                            <p className="text-xs text-orange-600 mt-2">
                                ⚠️ No hay datos en el spreadsheet. Agrega datos primero.
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título del Gráfico
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Engagement por Categoría"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Chart Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Gráfico
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {chartTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setChartType(type.id as any)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${chartType === type.id
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-xs font-medium">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Column Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Eje X (Categoría)
                            </label>
                            <select
                                value={xAxis}
                                onChange={(e) => setXAxis(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {columnConfigs.map(col => (
                                    <option key={col.id} value={col.id}>
                                        {col.title} ({col.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Eje Y (Valor)
                            </label>
                            <select
                                value={yAxis}
                                onChange={(e) => setYAxis(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {columnConfigs.map(col => (
                                    <option key={col.id} value={col.id}>
                                        {col.title} ({col.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Data Source Option */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="liveData"
                            checked={useLiveData}
                            onChange={(e) => setUseLiveData(e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="liveData" className="text-sm text-gray-600">
                            Usar datos en vivo (se actualiza con el spreadsheet)
                        </label>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!xAxis || !yAxis || data.length === 0}
                            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Agregar Gráfico
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
