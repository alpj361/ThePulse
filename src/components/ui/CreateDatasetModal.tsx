import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLoader, FiUpload, FiDatabase, FiCheckCircle, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { datasetsService, CreateDatasetInput } from '../../services/datasets';
import { DATASETS_CONFIG } from '../../config/datasets';

interface CreateDatasetModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

type DataSource = 'upload' | 'template' | 'manual';
type Step = 1 | 2 | 3 | 4 | 5;

export function CreateDatasetModal({ isOpen, onClose, projectId, onSuccess }: CreateDatasetModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Basic Info
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('private');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    // Step 2: Data Source
    const [dataSource, setDataSource] = useState<DataSource>('upload');

    // Step 3: File Upload or Template
    const [file, setFile] = useState<File | null>(null);
    const [uploadedData, setUploadedData] = useState<any[] | null>(null);

    // Step 4: Schema
    const [schema, setSchema] = useState<Array<{ name: string; type: string; nullable: boolean }>>([]);

    if (!isOpen) return null;

    const resetForm = () => {
        setCurrentStep(1);
        setName('');
        setDescription('');
        setVisibility('private');
        setTags([]);
        setNewTag('');
        setDataSource('upload');
        setFile(null);
        setUploadedData(null);
        setSchema([]);
        setError(null);
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setError(null);

        // Validate file size
        if (selectedFile.size > DATASETS_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
            setError(DATASETS_CONFIG.ERROR_MESSAGES.FILE_SIZE_EXCEEDED);
            return;
        }

        // Validate file format
        const extension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!extension || !DATASETS_CONFIG.SUPPORTED_FORMATS.includes(extension)) {
            setError(DATASETS_CONFIG.ERROR_MESSAGES.INVALID_FORMAT);
            return;
        }

        setFile(selectedFile);

        // Parse file
        try {
            const text = await selectedFile.text();
            let parsedData: any[];

            if (extension === 'json') {
                parsedData = JSON.parse(text);
            } else if (extension === 'csv') {
                // Simple CSV parser
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                parsedData = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });
            } else {
                throw new Error('Unsupported format');
            }

            // Validate row count
            if (parsedData.length > DATASETS_CONFIG.MAX_ROWS_PER_DATASET) {
                setError(DATASETS_CONFIG.ERROR_MESSAGES.ROW_LIMIT_EXCEEDED);
                return;
            }

            setUploadedData(parsedData);

            // Auto-infer schema
            if (parsedData.length > 0) {
                const inferredSchema = Object.keys(parsedData[0]).map(key => {
                    const sampleValue = parsedData[0][key];
                    let type = 'text';
                    if (!isNaN(Number(sampleValue))) type = 'number';
                    else if (sampleValue === 'true' || sampleValue === 'false') type = 'boolean';

                    return { name: key, type, nullable: false };
                });
                setSchema(inferredSchema);
            }
        } catch (err) {
            setError('Error parsing file. Please check the format.');
            console.error(err);
        }
    };

    const handleLoadTemplate = async () => {
        try {
            const response = await fetch('/data/mayors_scraped.json');
            const data = await response.json();

            setUploadedData(data);

            // Set template schema
            const templateSchema = [
                { name: 'Departamento', type: 'text', nullable: false },
                { name: 'Municipio', type: 'text', nullable: false },
                { name: 'Alcalde', type: 'text', nullable: false },
                { name: 'Partido', type: 'text', nullable: false },
            ];

            setSchema(templateSchema);
            setName('Guatemala Mayors 2024-2028');
            setDescription('Complete list of mayors with party affiliation');
            setTags(['government', 'politics', 'guatemala']);
            setVisibility('public');
        } catch (err) {
            setError('Error loading template data');
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        if (!uploadedData || uploadedData.length === 0) {
            setError('No data to submit');
            return;
        }

        if (!name.trim()) {
            setError('Dataset name is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const datasetInput: CreateDatasetInput = {
                name: name.trim(),
                description: description.trim() || undefined,
                visibility,
                project_id: projectId,
                source: dataSource === 'template' ? 'upload' : dataSource,
                data: uploadedData,
                schema,
                tags: tags.length > 0 ? tags : undefined,
            };

            await datasetsService.createDataset(datasetInput);
            onSuccess();
            resetForm();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create dataset');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return name.trim().length > 0;
            case 2:
                return dataSource !== null;
            case 3:
                return uploadedData !== null && uploadedData.length > 0;
            case 4:
                return schema.length > 0;
            default:
                return true;
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
                className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
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
                                    Create New Dataset
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Step {currentStep} of 5
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center justify-between">
                            {[1, 2, 3, 4, 5].map((step) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= currentStep
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                            }`}
                                    >
                                        {step < currentStep ? <FiCheckCircle className="w-5 h-5" /> : step}
                                    </div>
                                    {step < 5 && (
                                        <div
                                            className={`flex-1 h-1 mx-2 ${step < currentStep
                                                ? 'bg-blue-600'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
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

                            {/* Step 1: Basic Info */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Dataset Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Enter dataset name..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                            placeholder="Brief description..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Visibility
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setVisibility('private')}
                                                className={`p-4 rounded-lg border-2 transition-all ${visibility === 'private'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                    }`}
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white">Private</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Only you can access</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setVisibility('public')}
                                                className={`p-4 rounded-lg border-2 transition-all ${visibility === 'public'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                    }`}
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white">Public</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Everyone can view</div>
                                            </button>
                                        </div>
                                    </div>

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
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Add a tag..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddTag}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
                                                        <button onClick={() => handleRemoveTag(tag)} className="hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded-full p-0.5">
                                                            <FiX className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Data Source */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Choose Data Source
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setDataSource('upload')}
                                            className={`p-6 rounded-lg border-2 transition-all text-left ${dataSource === 'upload'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                }`}
                                        >
                                            <FiUpload className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                                            <div className="font-medium text-gray-900 dark:text-white mb-1">Upload File</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Upload CSV or JSON files
                                            </div>
                                        </button>

                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: File Upload or Template Loaded */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {dataSource === 'upload' && !uploadedData ? (
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                                            <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                Upload your dataset
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Supported formats: CSV, JSON (max {DATASETS_CONFIG.MAX_FILE_SIZE_MB}MB, {DATASETS_CONFIG.MAX_ROWS_PER_DATASET} rows)
                                            </p>
                                            <input
                                                type="file"
                                                accept=".csv,.json"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                          text-white rounded-lg cursor-pointer transition-colors"
                                            >
                                                <FiUpload className="w-5 h-5" />
                                                Choose File
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="flex items-center gap-3">
                                                    <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {dataSource === 'template' ? 'Template Loaded' : 'File Uploaded'}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {uploadedData?.length || 0} rows loaded
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {uploadedData && uploadedData.length > 0 && (
                                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Data Preview (first 5 rows)
                                                        </span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                                <tr>
                                                                    {Object.keys(uploadedData[0]).map((key) => (
                                                                        <th key={key} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                                                            {key}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                {uploadedData.slice(0, 5).map((row, idx) => (
                                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                        {Object.values(row).map((value: any, valIdx) => (
                                                                            <td key={valIdx} className="px-4 py-2 text-gray-900 dark:text-white">
                                                                                {String(value)}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 4: Schema Configuration */}
                            {currentStep === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Configure Schema
                                    </h3>
                                    <div className="space-y-3">
                                        {schema.map((column, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={column.name}
                                                        onChange={(e) => {
                                                            const newSchema = [...schema];
                                                            newSchema[idx].name = e.target.value;
                                                            setSchema(newSchema);
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <select
                                                    value={column.type}
                                                    onChange={(e) => {
                                                        const newSchema = [...schema];
                                                        newSchema[idx].type = e.target.value;
                                                        setSchema(newSchema);
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="date">Date</option>
                                                    <option value="boolean">Boolean</option>
                                                    <option value="json">JSON</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 5: Review & Confirm */}
                            {currentStep === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Review & Confirm
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Visibility</div>
                                            <div className="font-medium text-gray-900 dark:text-white capitalize">{visibility}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Rows</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{uploadedData?.length || 0} rows</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Columns</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{schema.length} columns</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button
                            onClick={() => {
                                if (currentStep > 1) {
                                    setCurrentStep((currentStep - 1) as Step);
                                    setError(null);
                                }
                            }}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    resetForm();
                                    onClose();
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>

                            {currentStep < 5 ? (
                                <button
                                    onClick={() => {
                                        if (canProceedToNextStep()) {
                                            setCurrentStep((currentStep + 1) as Step);
                                            setError(null);
                                        }
                                    }}
                                    disabled={!canProceedToNextStep()}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 
                    text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <FiArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 
                    text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting && <FiLoader className="w-4 h-4 animate-spin" />}
                                    {isSubmitting ? 'Creating...' : 'Create Dataset'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
