import React, { useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSpreadsheet } from '../../../context/SpreadsheetContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { DashboardWidget } from '../../../services/dashboards';

interface CustomChartWidgetProps {
    widget: DashboardWidget;
    onRemove: () => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

export function CustomChartWidget({ widget, onRemove }: CustomChartWidgetProps) {
    const { data: liveData } = useSpreadsheet();

    // Widget content structure:
    // {
    //   chartType: 'bar' | 'line' | 'area' | 'pie',
    //   xAxis: string (columnId),
    //   yAxis: string (columnId), // or array if we support multiple series later
    //   title: string,
    //   useLiveData: boolean,
    //   snapshotData?: any[] 
    // }

    const config = widget.content;

    const chartData = useMemo(() => {
        if (config.useLiveData) {
            return liveData;
        }
        return config.snapshotData || [];
    }, [config.useLiveData, config.snapshotData, liveData]);

    if (!config.xAxis || !config.yAxis) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 text-gray-500">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm text-center">Configuración incompleta</p>
            </div>
        );
    }

    const renderChart = () => {
        switch (config.chartType) {
            case 'line':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={config.xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={config.yAxis} stroke="#8884d8" />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={config.xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey={config.yAxis} stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={config.yAxis}
                            nameKey={config.xAxis}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={config.xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={config.yAxis} fill="#8884d8" />
                    </BarChart>
                );
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-700 truncate">
                    {config.title || 'Gráfico Personalizado'}
                </h3>
                <button
                    onClick={onRemove}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                    <span className="sr-only">Eliminar</span>
                    &times;
                </button>
            </div>
            <div className="flex-1 min-h-0 p-2">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
