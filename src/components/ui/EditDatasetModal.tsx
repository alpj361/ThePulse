import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLoader, FiSave, FiDatabase } from 'react-icons/fi';
import { datasetsService, Dataset, CreateDatasetInput } from '../../services/datasets';

interface EditDatasetModalProps {
    dataset: Dataset;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userIsAdmin: boolean;
}

export function EditDatasetModal({ dataset, isOpen, onClose, onSuccess, userIsAdmin }: EditDatasetModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState(dataset.name);
    const [description, setDescription] = useState(dataset.description || '');
    const [tags, setTags] = useState<string[]>(dataset.tags || []);
    const [newTag, setNewTag] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>(dataset.visibility);

    if (!isOpen) return null;

    // Check if user can edit this dataset
    const canEdit = dataset.visibility === 'private' || userIsAdmin;

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
        if (!canEdit) {
            setError('You do not have permission to edit this dataset');
            return;
        }

        if (!name.trim()) {
            setError('Dataset name is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const updates: Partial<CreateDatasetInput> = {
                name: name.trim(),
                description: description.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
            };

            // Only allow changing visibility if user is admin
            if (userIsAdmin && visibility !== dataset.visibility) {
                updates.visibility = visibility;
            }

            await datasetsService.updateDataset(dataset.id, updates);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update dataset');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <FiDatabase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Edit Dataset
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Update dataset metadata
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {!canEdit && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm"
                                >
                                    ⚠️ Only admins can edit public datasets
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Dataset Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Enter dataset name..."
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={!canEdit}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none
                    disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Brief description..."
                                />
                            </div>

                            {/* Visibility (only for admins) */}
                            {userIsAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Visibility
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setVisibility('private')}
                                            disabled={!canEdit}
                                            className={`p-4 rounded-lg border-2 transition-all ${visibility === 'private'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <div className="font-medium text-gray-900 dark:text-white">Private</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Only you</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVisibility('public')}
                                            disabled={!canEdit}
                                            className={`p-4 rounded-lg border-2 transition-all ${visibility === 'public'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <div className="font-medium text-gray-900 dark:text-white">Public</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Everyone</div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tags
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        disabled={!canEdit}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="Add a tag..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        disabled={!canEdit}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20
                           text-blue-800 dark:text-blue-300 text-sm rounded-full"
                                            >
                                                {tag}
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded-full p-0.5"
                                                    >
                                                        <FiX className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canEdit}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 
                text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting && <FiLoader className="w-4 h-4 animate-spin" />}
                            <FiSave className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
