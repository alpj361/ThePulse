import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDatabase, FiLoader } from 'react-icons/fi';
import { Dataset } from '../../services/datasets';
import { DatasetCard } from './DatasetCard';

interface DatasetListProps {
    datasets: Dataset[];
    onSelectDataset: (dataset: Dataset) => void;
    onDeleteDataset: (datasetId: string) => void;
    isLoading?: boolean;
}

export function DatasetList({ datasets, onSelectDataset, onDeleteDataset, isLoading }: DatasetListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <FiLoader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Loading datasets...</p>
                </div>
            </div>
        );
    }

    if (datasets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
            >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 
          border-2 border-dashed border-blue-300 dark:border-blue-700 max-w-md mx-auto">
                    <FiDatabase className="w-16 h-16 text-blue-400 dark:text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No datasets yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first dataset to start organizing and querying your data
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {datasets.map((dataset, index) => (
                    <motion.div
                        key={dataset.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <DatasetCard
                            dataset={dataset}
                            onSelect={onSelectDataset}
                            onDelete={onDeleteDataset}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
