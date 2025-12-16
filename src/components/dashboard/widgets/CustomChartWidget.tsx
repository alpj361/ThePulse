import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSpreadsheet } from '../../../context/SpreadsheetContext';
import { Loader2, AlertCircle, GripVertical, X, TrendingUp } from 'lucide-react';
import { DashboardWidget } from '../../../services/dashboards';
import { useDashboardTheme } from '../../../context/DashboardThemeContext';

interface CustomChartWidgetProps {
    widget: DashboardWidget;
    onRemove: () => void;
}

export function CustomChartWidget({ widget, onRemove }: CustomChartWidgetProps) {
    const { data: liveData } = useSpreadsheet();
    const { theme } = useDashboardTheme();
    const [isHovered, setIsHovered] = useState(false);

    const config = widget.content;

    // Use theme colors for charts
    const THEME_COLORS = [
        theme.colors.primary,
        theme.colors.primaryLight,
        theme.colors.accent,
        theme.colors.secondary,
        theme.colors.primaryDark,
        '#8b5cf6'
    ];

    const chartData = useMemo(() => {
        if (config.useLiveData) {
            return liveData;
        }
        return config.snapshotData || [];
    }, [config.useLiveData, config.snapshotData, liveData]);

    if (!config.xAxis || !config.yAxis) {
        return (
            <motion.div 
                className="h-full flex flex-col items-center justify-center p-4 rounded-2xl"
                style={{
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}30`
                }}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" style={{ color: theme.colors.textSecondary }} />
                <p className="text-sm text-center" style={{ color: theme.colors.textSecondary }}>
                    Configuración incompleta
                </p>
            </motion.div>
        );
    }

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div 
                    className="rounded-lg p-3 shadow-xl border"
                    style={{
                        background: theme.colors.surface,
                        borderColor: theme.colors.border
                    }}
                >
                    <p className="font-semibold mb-1" style={{ color: theme.colors.text }}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data: chartData,
        };

        switch (config.chartType) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.border}60`} />
                        <XAxis 
                            dataKey={config.xAxis} 
                            stroke={theme.colors.textSecondary}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                            stroke={theme.colors.textSecondary}
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                            type="monotone" 
                            dataKey={config.yAxis} 
                            stroke={theme.colors.primary}
                            strokeWidth={3}
                            dot={{ fill: theme.colors.primary, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.border}60`} />
                        <XAxis 
                            dataKey={config.xAxis}
                            stroke={theme.colors.textSecondary}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                            stroke={theme.colors.textSecondary}
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area 
                            type="monotone" 
                            dataKey={config.yAxis} 
                            stroke={theme.colors.primary}
                            strokeWidth={2}
                            fill="url(#areaGradient)"
                        />
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
                            label={(entry) => entry.name}
                            labelLine={false}
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.9}/>
                                <stop offset="95%" stopColor={theme.colors.primaryLight} stopOpacity={0.7}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.border}60`} />
                        <XAxis 
                            dataKey={config.xAxis}
                            stroke={theme.colors.textSecondary}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                            stroke={theme.colors.textSecondary}
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar 
                            dataKey={config.yAxis} 
                            fill="url(#barGradient)"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                );
        }
    };

    return (
        <motion.div 
            className="h-full flex flex-col rounded-2xl overflow-hidden relative group"
            style={{
                background: theme.colors.surface,
                boxShadow: isHovered 
                    ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${theme.colors.border}30`
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            {/* Header */}
            <div 
                className="drag-handle flex items-center justify-between px-4 py-3 cursor-move"
                style={{
                    background: `linear-gradient(90deg, ${theme.colors.primary}15 0%, ${theme.colors.primary}05 100%)`,
                    borderBottom: `1px solid ${theme.colors.border}40`
                }}
            >
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: isHovered ? 360 : 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <TrendingUp className="h-4 w-4" style={{ color: theme.colors.primary }} />
                    </motion.div>
                    <h3 className="font-semibold text-sm truncate" style={{ color: theme.colors.text }}>
                        {config.title || 'Gráfico Personalizado'}
                    </h3>
                </div>
                <button
                    onClick={onRemove}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    style={{ color: theme.colors.error }}
                    title="Eliminar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            
            {/* Chart */}
            <div className="flex-1 min-h-0 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
