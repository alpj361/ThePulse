import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { FiSearch, FiFile, FiLink, FiVideo, FiMusic, FiFileText, FiCheck, FiLoader } from 'react-icons/fi';
import { getCodexItemsByUser } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

interface CodexItem {
    id: string;
    user_id: string;
    tipo: string;
    titulo: string;
    descripcion?: string;
    etiquetas: string[];
    proyecto: string;
    project_id?: string;
    url?: string;
    nombre_archivo?: string;
    fecha: string;
    created_at: string;
    content?: string;
    source_url?: string;
}

interface CodexSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (items: CodexItem[]) => void;
    projectId: string;
    multiSelect?: boolean;
}

export default function CodexSelectorModal({
    isOpen,
    onClose,
    onSelect,
    projectId,
    multiSelect = false
}: CodexSelectorModalProps) {
    const { user } = useAuth();
    const [codexItems, setCodexItems] = useState<CodexItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<CodexItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadCodexItems();
        }
    }, [isOpen, user?.id]);

    useEffect(() => {
        filterItems();
    }, [searchQuery, typeFilter, codexItems]);

    const loadCodexItems = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const items = await getCodexItemsByUser(user.id);
            // Filter out groups and only show actual content items
            const contentItems = items.filter((item: CodexItem) =>
                !item.tipo.includes('grupo') &&
                (item.url || item.content || item.descripcion)
            );
            setCodexItems(contentItems);
            setFilteredItems(contentItems);
        } catch (error) {
            console.error('Error loading codex items:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        let filtered = codexItems;

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(item => item.tipo === typeFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.titulo.toLowerCase().includes(query) ||
                item.descripcion?.toLowerCase().includes(query) ||
                item.etiquetas.some(tag => tag.toLowerCase().includes(query))
            );
        }

        setFilteredItems(filtered);
    };

    const toggleItemSelection = (itemId: string) => {
        const newSelected = new Set(selectedItems);

        if (multiSelect) {
            if (newSelected.has(itemId)) {
                newSelected.delete(itemId);
            } else {
                newSelected.add(itemId);
            }
        } else {
            newSelected.clear();
            newSelected.add(itemId);
        }

        setSelectedItems(newSelected);
    };

    const handleConfirm = () => {
        const selected = codexItems.filter(item => selectedItems.has(item.id));
        onSelect(selected);
        handleClose();
    };

    const handleClose = () => {
        setSelectedItems(new Set());
        setSearchQuery('');
        setTypeFilter('all');
        onClose();
    };

    const getTypeIcon = (tipo: string) => {
        switch (tipo) {
            case 'enlace':
                return <FiLink className="w-5 h-5" />;
            case 'video':
                return <FiVideo className="w-5 h-5" />;
            case 'audio':
                return <FiMusic className="w-5 h-5" />;
            case 'documento':
                return <FiFileText className="w-5 h-5" />;
            case 'nota':
                return <FiFile className="w-5 h-5" />;
            default:
                return <FiFile className="w-5 h-5" />;
        }
    };

    const getTypeColor = (tipo: string) => {
        switch (tipo) {
            case 'enlace':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'video':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'audio':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'documento':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'nota':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const typeOptions = [
        { value: 'all', label: 'Todos' },
        { value: 'enlace', label: 'Enlaces' },
        { value: 'documento', label: 'Documentos' },
        { value: 'video', label: 'Videos' },
        { value: 'audio', label: 'Audios' },
        { value: 'nota', label: 'Notas' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        📊 Seleccionar Elementos del Codex
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona {multiSelect ? 'uno o más elementos' : 'un elemento'} del Codex para capturar datos automáticamente
                    </DialogDescription>
                </DialogHeader>

                {/* Filters */}
                <div className="space-y-4 py-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Buscar por título, descripción o etiquetas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Type filter */}
                    <div className="flex gap-2 flex-wrap">
                        {typeOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setTypeFilter(option.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === option.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-4 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-gray-600">Cargando elementos...</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FiFile className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-medium">No se encontraron elementos</p>
                            <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const isSelected = selectedItems.has(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItemSelection(item.id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg ${getTypeColor(item.tipo)}`}>
                                            {getTypeIcon(item.tipo)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold text-gray-900 truncate">{item.titulo}</h4>
                                                {isSelected && (
                                                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <FiCheck className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {item.descripcion && (
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.descripcion}</p>
                                            )}

                                            {item.url && (
                                                <p className="text-xs text-blue-600 mt-1 truncate">{item.url}</p>
                                            )}

                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <Badge variant="outline" className="text-xs">
                                                    {item.tipo}
                                                </Badge>
                                                {item.proyecto && (
                                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                        {item.proyecto}
                                                    </Badge>
                                                )}
                                                {item.etiquetas.slice(0, 3).map((tag, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {item.etiquetas.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{item.etiquetas.length - 3}
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(item.created_at).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                        {selectedItems.size > 0 && (
                            <span className="font-medium text-blue-600">
                                {selectedItems.size} elemento{selectedItems.size !== 1 ? 's' : ''} seleccionado{selectedItems.size !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedItems.size === 0}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        >
                            Capturar Datos ({selectedItems.size})
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
