import React from 'react';
import { motion } from 'framer-motion';
import { FiDatabase, FiLock, FiGlobe, FiCalendar, FiHash, FiTrash2, FiEye, FiEdit, FiMoreVertical } from 'react-icons/fi';
import { Dataset } from '../../services/datasets';
import { format } from 'date-fns';

interface DatasetCardProps {
    dataset: Dataset;
    onSelect: (dataset: Dataset) => void;
    onEdit: (dataset: Dataset) => void;
    onDelete: (datasetId: string) => void;
}

const sourceIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    upload: { icon: <FiDatabase className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
    scraper: { icon: <FiGlobe className="w-4 h-4" />, color: 'text-green-600 dark:text-green-400' },
    sql: { icon: <FiDatabase className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400' },
    python: { icon: <FiDatabase className="w-4 h-4" />, color: 'text-orange-600 dark:text-orange-400' },
    api: { icon: <FiGlobe className="w-4 h-4" />, color: 'text-cyan-600 dark:text-cyan-400' },
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export function DatasetCard({ dataset, onSelect, onEdit, onDelete }: DatasetCardProps) {
    const [showMenu, setShowMenu] = React.useState(false);

    const sourceInfo = sourceIcons[dataset.source] || sourceIcons.upload;
    const isPublic = dataset.visibility === 'public';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="relative group"
        >
            <div
                onClick={() => onSelect(dataset)}
                className="p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 
          hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer
          shadow-sm hover:shadow-xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${sourceInfo.color}`}>
                            {sourceInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {dataset.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {isPublic ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                    bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                        <FiGlobe className="w-3 h-3" />
                                        Public
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                    bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                        <FiLock className="w-3 h-3" />
                                        Private
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <FiMoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(dataset);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                                >
                                    <FiEye className="w-4 h-4" />
                                    View Dataset
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(dataset);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <FiEdit className="w-4 h-4" />
                                    Edit Dataset
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
                                            onDelete(dataset.id);
                                        }
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {dataset.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {dataset.description}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                        <FiHash className="w-3 h-3" />
                        <span>{dataset.row_count.toLocaleString()} rows</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FiDatabase className="w-3 h-3" />
                        <span>{formatBytes(dataset.size_bytes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        <span>{format(new Date(dataset.created_at), 'MMM d, yyyy')}</span>
                    </div>
                </div>

                {/* Tags */}
                {dataset.tags && dataset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {dataset.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md text-xs bg-blue-50 dark:bg-blue-900/20 
                  text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            >
                                {tag}
                            </span>
                        ))}
                        {dataset.tags.length > 3 && (
                            <span className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                +{dataset.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
