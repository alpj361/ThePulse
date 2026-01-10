import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiLoader, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { datasetsService, Dataset } from '../../services/datasets';
import { format } from 'date-fns';

interface DatasetPreviewTableProps {
    datasetId: string;
    maxRows?: number;
}

const ROWS_PER_PAGE = 20;

export function DatasetPreviewTable({ datasetId, maxRows = 100 }: DatasetPreviewTableProps) {
    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        loadData();
    }, [datasetId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const datasetInfo = await datasetsService.getDataset(datasetId);
            const previewData = await datasetsService.previewData(datasetId, maxRows);

            setDataset(datasetInfo);
            setData(previewData);
        } catch (error) {
            console.error('Error loading dataset preview:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleExportCSV = () => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dataset?.name || 'dataset'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <FiLoader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Loading dataset...</p>
                </div>
            </div>
        );
    }

    if (!dataset || !data || data.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No data available</p>
            </div>
        );
    }

    const columns = Object.keys(data[0]);

    // Sort data
    let sortedData = [...data];
    if (sortColumn) {
        sortedData.sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            if (aVal === bVal) return 0;

            const comparison = aVal < bVal ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    // Paginate data
    const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {/* Dataset Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{dataset.name}</h3>
                    {dataset.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{dataset.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{dataset.row_count.toLocaleString()} total rows</span>
                        <span>•</span>
                        <span>{columns.length} columns</span>
                        <span>•</span>
                        <span>Created {format(new Date(dataset.created_at), 'MMM d, yyyy')}</span>
                    </div>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
            text-white rounded-lg transition-colors"
                >
                    <FiDownload className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        onClick={() => handleSort(column)}
                                        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {column}
                                            {sortColumn === column && (
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {paginatedData.map((row, rowIdx) => (
                                <motion.tr
                                    key={rowIdx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: rowIdx * 0.02 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    {columns.map((column) => (
                                        <td key={column} className="px-4 py-3 text-gray-900 dark:text-white">
                                            {row[column] !== null && row[column] !== undefined
                                                ? String(row[column])
                                                : <span className="text-gray-400 italic">null</span>}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} rows
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
