import React, { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { FiCheck, FiChevronDown, FiX } from 'react-icons/fi';
import { getFindingsByTheme } from '../../services/coverages';

interface EntitySelectorProps {
    projectId: string;
    selectedEntities: string[];
    onChange: (entities: string[]) => void;
    className?: string;
}

export default function EntitySelector({
    projectId,
    selectedEntities,
    onChange,
    className = ""
}: EntitySelectorProps) {
    const [query, setQuery] = useState('');
    const [availableEntities, setAvailableEntities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Cargar entidades existentes desde hallazgos
    useEffect(() => {
        const fetchEntities = async () => {
            setLoading(true);
            try {
                const findings = await getFindingsByTheme(projectId);
                const entities = new Set<string>();

                Object.values(findings).flat().forEach(card => {
                    if (card.entity) {
                        // Separar por comas si hay múltiples
                        card.entity.split(',').forEach(e => {
                            const trimmed = e.trim();
                            if (trimmed) entities.add(trimmed);
                        });
                    }
                });

                setAvailableEntities(Array.from(entities).sort());
            } catch (error) {
                console.error('Error fetching entities:', error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchEntities();
        }
    }, [projectId]);

    const filteredEntities = query === ''
        ? availableEntities
        : availableEntities.filter((entity) =>
            entity.toLowerCase().includes(query.toLowerCase())
        );

    const addEntity = (entity: string) => {
        const trimmed = entity.trim();
        if (trimmed && !selectedEntities.includes(trimmed)) {
            onChange([...selectedEntities, trimmed]);
        }
        setQuery('');
    };

    const removeEntity = (entityToRemove: string) => {
        onChange(selectedEntities.filter(e => e !== entityToRemove));
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresas / Entidades
            </label>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedEntities.map((entity) => (
                    <span
                        key={entity}
                        className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                        {entity}
                        <button
                            type="button"
                            onClick={() => removeEntity(entity)}
                            className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none"
                        >
                            <FiX className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            {/* Combobox */}
            <Combobox value={null} onChange={(val: string | null) => val && addEntity(val)}>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter' && query) {
                                    e.preventDefault();
                                    addEntity(query);
                                }
                            }}
                            placeholder="Buscar o escribir nueva entidad..."
                            value={query}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <FiChevronDown
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>

                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                        {query.length > 0 && !availableEntities.some(e => e.toLowerCase() === query.toLowerCase()) && (
                            <Combobox.Option
                                value={query}
                                className={({ active }: { active: boolean }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                    }`
                                }
                            >
                                Crear "{query}"
                            </Combobox.Option>
                        )}

                        {filteredEntities.map((entity) => (
                            <Combobox.Option
                                key={entity}
                                value={entity}
                                className={({ active }: { active: boolean }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                    }`
                                }
                            >
                                {({ selected, active }: { selected: boolean; active: boolean }) => (
                                    <>
                                        <span
                                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                }`}
                                        >
                                            {entity}
                                        </span>
                                        {(selected || selectedEntities.includes(entity)) && (
                                            <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                                    }`}
                                            >
                                                <FiCheck className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </Combobox.Option>
                        ))}

                        {loading && (
                            <div className="py-2 px-4 text-gray-500 italic">Cargando entidades...</div>
                        )}

                        {!loading && filteredEntities.length === 0 && query !== '' && (
                            <div className="py-2 px-4 text-gray-500 italic">No se encontraron coincidencias</div>
                        )}
                    </Combobox.Options>
                </div>
            </Combobox>
        </div>
    );
}
