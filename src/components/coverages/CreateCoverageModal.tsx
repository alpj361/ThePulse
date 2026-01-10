import React, { useState } from 'react';
import { FiX, FiMapPin } from 'react-icons/fi';
import { createCoverage, CreateCoverageData, CoverageType, RelevanceLevel } from '../../services/coverages';
import EntitySelector from './EntitySelector';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

type CoverageCategory = 'Investigación' | 'Hallazgo' | 'Demográfico';

interface SentimentOption {
    value: 'Positivo' | 'Neutral' | 'Negativo' | 'Mixto';
    emoji: string;
    label: string;
}

const SENTIMENT_OPTIONS: SentimentOption[] = [
    { value: 'Positivo', emoji: '😊', label: 'Positivo' },
    { value: 'Neutral', emoji: '😐', label: 'Neutral' },
    { value: 'Negativo', emoji: '😞', label: 'Negativo' },
    { value: 'Mixto', emoji: '😕', label: 'Mixto' },
];

const ICON_OPTIONS = ['📍', '🏙️', '🌍', '🗺️', '🏛️', '📌', '🎯', '🔍'];

export default function CreateCoverageModal({ isOpen, onClose, projectId, onSuccess }: Props) {
    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState('📍');
    const [category, setCategory] = useState<CoverageCategory>('Hallazgo');
    const [description, setDescription] = useState('');

    // Ubicación
    const [coverageType, setCoverageType] = useState<CoverageType>('ciudad');
    const [name, setName] = useState('');
    const [parentName, setParentName] = useState('');
    const [pais, setPais] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');

    // Demográficos
    const [sentiment, setSentiment] = useState<SentimentOption | null>(null);
    const [peopleCount, setPeopleCount] = useState('');
    const [entitiesList, setEntitiesList] = useState<string[]>([]);
    const [demographicNotes, setDemographicNotes] = useState('');

    // Adicionales
    const [relevance, setRelevance] = useState<RelevanceLevel>('medium');
    const [tagsText, setTagsText] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validación
        if (!title.trim()) {
            setError('El título es requerido');
            return;
        }

        if (!name.trim() && !lat && !lng) {
            setError('Debes proporcionar al menos un nombre de ubicación o coordenadas');
            return;
        }

        try {
            setIsSubmitting(true);

            // Preparar datos demográficos
            const demographicData: any = {};
            if (category === 'Demográfico') {
                if (sentiment) {
                    demographicData.sentiment = {
                        value: sentiment.value,
                        emoji: sentiment.emoji
                    };
                }
                if (peopleCount) {
                    demographicData.people_count = parseInt(peopleCount);
                }
                if (entitiesList.length > 0) {
                    demographicData.entities_involved = entitiesList.map(e => ({
                        name: e,
                        source: 'manual'
                    }));
                }
                if (demographicNotes.trim()) {
                    demographicData.demographic_notes = demographicNotes;
                }
            }

            // Preparar coordenadas
            const coordinates = lat && lng ? {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            } : undefined;

            // Preparar tags
            const tags = tagsText.trim() ? tagsText.split(',').map(t => t.trim()) : [];

            const data: CreateCoverageData = {
                project_id: projectId,
                coverage_type: coverageType,
                name: name.trim() || 'Sin nombre',
                parent_name: parentName.trim() || undefined,
                description: description.trim() || undefined,
                relevance,
                coordinates,
                tags: tags.length > 0 ? tags : undefined,
            };

            await createCoverage(data);

            // Guardar datos adicionales en extra_data si es necesario
            if (Object.keys(demographicData).length > 0 || icon !== '📍' || category) {
                // Aquí podrías hacer un update adicional si el backend lo soporta
                console.log('Extra data:', { icon, category, demographicData });
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (err: any) {
            console.error('Error creating coverage:', err);
            setError(err.message || 'Error al crear cobertura');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setIcon('📍');
        setCategory('Hallazgo');
        setDescription('');
        setCoverageType('ciudad');
        setName('');
        setParentName('');
        setPais('');
        setLat('');
        setLng('');
        setSentiment(null);
        setPeopleCount('');
        setEntitiesList([]);
        setDemographicNotes('');
        setRelevance('medium');
        setTagsText('');
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Crear Cobertura</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Campos Básicos */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Información Básica</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Ej: Cobertura en Ciudad de Guatemala"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Icono
                                </label>
                                <select
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {ICON_OPTIONS.map(ico => (
                                        <option key={ico} value={ico}>{ico} {ico}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as CoverageCategory)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="Investigación">Investigación</option>
                                    <option value="Hallazgo">Hallazgo</option>
                                    <option value="Demográfico">Demográfico</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Describe la cobertura..."
                            />
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiMapPin className="w-4 h-4" />
                            Ubicación
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo de Cobertura
                                </label>
                                <select
                                    value={coverageType}
                                    onChange={(e) => setCoverageType(e.target.value as CoverageType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="pais">País</option>
                                    <option value="departamento">Departamento</option>
                                    <option value="ciudad">Ciudad</option>
                                    <option value="zona">Zona</option>
                                    <option value="region">Región</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Ej: Guatemala"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Ubicación Padre
                                </label>
                                <input
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Ej: Guatemala (departamento)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    País
                                </label>
                                <input
                                    type="text"
                                    value={pais}
                                    onChange={(e) => setPais(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Ej: Guatemala"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Latitud
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={lat}
                                    onChange={(e) => setLat(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="14.6349"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Longitud
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="-90.5069"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campos Demográficos */}
                    {category === 'Demográfico' && (
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Datos Demográficos</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Sentimiento
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SENTIMENT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setSentiment(opt)}
                                            className={`p-3 rounded-lg border-2 transition-all ${sentiment?.value === opt.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                }`}
                                        >
                                            <div className="text-3xl mb-1">{opt.emoji}</div>
                                            <div className="text-xs text-gray-700 dark:text-gray-300">{opt.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cantidad de Personas
                                </label>
                                <input
                                    type="number"
                                    value={peopleCount}
                                    onChange={(e) => setPeopleCount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Ej: 1500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Empresas/Entidades Involucradas
                                </label>
                                <EntitySelector
                                    projectId={projectId}
                                    selectedEntities={entitiesList}
                                    onChange={setEntitiesList}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Busca entidades existentes o crea nuevas (Enter para agregar)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notas Demográficas
                                </label>
                                <textarea
                                    value={demographicNotes}
                                    onChange={(e) => setDemographicNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Notas adicionales sobre la demografía..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Campos Adicionales */}
                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Adicional</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Relevancia
                            </label>
                            <select
                                value={relevance}
                                onChange={(e) => setRelevance(e.target.value as RelevanceLevel)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Etiquetas
                            </label>
                            <input
                                type="text"
                                value={tagsText}
                                onChange={(e) => setTagsText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Separadas por comas: tag1, tag2, tag3"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear Cobertura'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
