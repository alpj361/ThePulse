import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from './card';
import { FiBox, FiAlertTriangle, FiWatch, FiTrash2, FiX, FiMapPin, FiEdit, FiSave, FiChevronDown, FiChevronUp, FiGrid, FiDollarSign, FiClock, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { EXTRACTORW_API_URL } from '../../services/api';
import { deleteCapturadoCard, updateCapturadoCard, deleteAllCapturadoCards, CapturadoUpdatePayload, createCapturadoCard, CapturadoCreatePayload } from '../../services/capturados';
// Coberturas: eliminado botón de cobertura geográfica en UI por solicitud
// import { createCoverageFromCard, hasValidGeographicInfo } from '../../services/coverages';
import { DisplayCards } from '@/components/ui/display-cards';

interface CapturadoCard {
  id: string;
  entity: string | null;
  amount: number | null;
  currency: string | null;
  city: string | null;
  department: string | null;
  discovery: string | null;
  source: string | null;
  start_date: string | null;
  duration_days: number | null;
  description: string | null;
  created_at: string;
  topic?: string | null;
}

interface Props {
  projectId: string;
  reloadKey?: number;
}

export default function CapturedCards({ projectId, reloadKey }: Props) {
  const { session } = useAuth();
  const [cards, setCards] = useState<CapturadoCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  // const [addingToCoverage, setAddingToCoverage] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CapturadoCard | null>(null);
  const [editData, setEditData] = useState<CapturadoUpdatePayload>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState<CapturadoCreatePayload>({});
  const [creating, setCreating] = useState(false);

  // Etiquetas en español para campos
  const editFieldLabels: Record<string, string> = {
    entity: 'Entidad',
    city: 'Ciudad',
    department: 'Departamento',
    description: 'Descripción',
    discovery: 'Hallazgo',
  };

  const createFieldLabels: Record<string, string> = {
    entity: 'Entidad',
    discovery: 'Hallazgo',
    description: 'Descripción',
    city: 'Ciudad',
    department: 'Departamento',
    amount: 'Monto',
    currency: 'Moneda',
    source: 'Fuente',
    start_date: 'Fecha',
    duration_days: 'Duración (días)',
    counter: 'Contador',
    percentage: 'Porcentaje',
    quantity: 'Cantidad',
  };

  // Estado adicional para duración avanzada y periodo de tiempo
  const [durationYears, setDurationYears] = useState<number | ''>('');
  const [durationMonths, setDurationMonths] = useState<number | ''>('');
  const [durationDays, setDurationDays] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');

  const [timeType, setTimeType] = useState<'day'|'year_range'|'decade'|'custom'|''>('');
  const [timeDate, setTimeDate] = useState<string>('');
  const [timeStartYear, setTimeStartYear] = useState<number | ''>('');
  const [timeEndYear, setTimeEndYear] = useState<number | ''>('');
  const [timeDecadeStart, setTimeDecadeStart] = useState<number | ''>('');
  const [timeLowerDate, setTimeLowerDate] = useState<string>('');
  const [timeUpperDate, setTimeUpperDate] = useState<string>('');
  const [timeBounds, setTimeBounds] = useState<'[]'|'[)'|'()'|'(]'|'[)' >('[)');

  useEffect(() => {
    if (projectId) {
      fetchCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadKey]);

  async function fetchCards() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${EXTRACTORW_API_URL}/capturados?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data = await response.json();
      setCards(data.cards || []);
    } catch (err: any) {
      console.error('Error fetching capturado cards:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este hallazgo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingCard(cardId);
      await deleteCapturadoCard(cardId, session?.access_token || '');
      
      // Actualizar la lista local removiendo la tarjeta eliminada
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      
    } catch (err: any) {
      console.error('Error deleting card:', err);
      alert(`Error eliminando hallazgo: ${err.message || 'Error desconocido'}`);
    } finally {
      setDeletingCard(null);
    }
  }

  // function handleAddToCoverage(card: CapturadoCard) { /* Eliminado */ }

  function handleAddToSpreadsheet(card: CapturadoCard) {
    // Placeholder por ahora. Se definirá el flujo de integración.
    console.log('Añadir al Spreadsheet:', {
      id: card.id,
      entity: card.entity,
      amount: card.amount,
      currency: card.currency,
      duration_days: card.duration_days,
      description: card.description,
    });
    alert('Se añadirá este hallazgo al Spreadsheet (pendiente de implementación).');
  }

  function openEditModal(card: CapturadoCard) {
    setEditingCard(card);
    setEditData({
      entity: card.entity || '',
      city: card.city || '',
      department: card.department || '',
      description: card.description || '',
      discovery: card.discovery || ''
    });
  }

  async function handleSaveEdit() {
    if (!editingCard) return;
    try {
      setSavingEdit(true);
      const updated = await updateCapturadoCard(editingCard.id, editData, session?.access_token || '');
      // actualizar lista local
      setCards(prev => prev.map(c => c.id === updated.card.id ? updated.card : c));
      setEditingCard(null);
    } catch (err: any) {
      alert(`Error guardando cambios: ${err.message || 'Desconocido'}`);
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <FiWatch className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-6">
        <FiAlertTriangle className="inline mr-2" />
        {error}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <FiBox className="inline mr-2" />
        No se han registrado hallazgos capturados para este proyecto.
      </div>
    );
  }

  // Agrupar por topic
  const groupedByTopic: Record<string, CapturadoCard[]> = cards.reduce((acc, card) => {
    const key = card.topic || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(card);
    return acc;
  }, {} as Record<string, CapturadoCard[]>);

  const topics = Object.keys(groupedByTopic);

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const expandAll = () => setExpandedTopics(topics);
  const collapseAll = () => setExpandedTopics([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Hallazgos Capturados</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Añadir hallazgo manual
          </button>
          <button
            onClick={expandAll}
            title="Expandir todo"
            aria-label="Expandir todo"
            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
          >
            <FiChevronDown className="w-5 h-5" />
          </button>
          <button
            onClick={collapseAll}
            title="Contraer todo"
            aria-label="Contraer todo"
            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
          >
            <FiChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              if (!confirm('¿Eliminar TODOS los hallazgos del proyecto?')) return;
              await deleteAllCapturadoCards(projectId, session?.access_token || '');
              fetchCards();
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Eliminar todo
          </button>
        </div>
      </div>

      {topics.map(topic => {
        const groupCards = groupedByTopic[topic];
        const isExpanded = expandedTopics.includes(topic);
        
        const displayCardsData = groupCards.slice(0,3).map(c => ({
          title: c.entity || c.discovery || 'Hallazgo',
          description: c.description || '',
          date: new Date(c.created_at).toLocaleDateString(),
        }));

        return (
          <div key={topic} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/20">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleTopic(topic)}
            >
              <h3 className="text-lg font-semibold">{topic} ({groupCards.length})</h3>
              <FiChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>

            {isExpanded ? (
              <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCards.map(card => {
                  // Determine card data types for badges
                  const hasFinancial = card.amount !== null;
                  const hasLocation = card.city || card.department;
                  const hasDuration = card.duration_days !== null;
                  const hasQuantifiable = (card as any).counter || (card as any).percentage || (card as any).quantity;
                  
                  return (
                    <Card 
                      key={card.id} 
                      className="relative group bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-800 border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                    >
                      {/* Gradient overlay effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(card); }} 
                          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          title="Editar"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} 
                          disabled={deletingCard === card.id} 
                          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingCard === card.id ? <FiWatch className="animate-spin w-3.5 h-3.5" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                        </button>
                        {(card.amount || card.duration_days) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToSpreadsheet(card); }}
                            className="p-2 bg-green-500/90 backdrop-blur-sm text-white hover:bg-green-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                            title="Añadir al Spreadsheet"
                          >
                            <FiGrid className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Data type badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        {hasFinancial && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-sm">
                            <FiDollarSign className="w-3 h-3" />
                            Financiero
                          </span>
                        )}
                        {hasLocation && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-sm">
                            <FiMapPin className="w-3 h-3" />
                            Ubicación
                          </span>
                        )}
                        {hasDuration && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-sm">
                            <FiClock className="w-3 h-3" />
                            Duración
                          </span>
                        )}
                        {hasQuantifiable && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-sm">
                            <FiBarChart2 className="w-3 h-3" />
                            Datos
                          </span>
                        )}
                      </div>

                      <CardHeader className="pt-16 pb-3">
                        <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 leading-tight">
                          {card.entity || card.discovery || 'Hallazgo'}
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                          {new Date(card.created_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </CardHeader>
                      
                      <CardContent className="space-y-3 text-sm pb-5">
                        {/* Financial info */}
                        {card.amount && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <FiDollarSign className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Monto</p>
                              <p className="font-bold text-green-700 dark:text-green-300">
                                {card.currency || 'Q'} {card.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Location info */}
                        {hasLocation && (
                          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <FiMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Ubicación</p>
                              <p className="font-medium text-blue-700 dark:text-blue-300">
                                {[card.city, card.department].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Duration info */}
                        {card.duration_days && (
                          <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <FiClock className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Duración</p>
                              <p className="font-medium text-purple-700 dark:text-purple-300">
                                {card.duration_days} días
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {card.description && (
                          <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed px-2 py-1 border-l-2 border-blue-300 dark:border-blue-700">
                            "{card.description}"
                          </p>
                        )}

                        {/* Source */}
                        {card.source && (
                          <blockquote className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 pl-3 py-2 rounded-r">
                            {card.source}
                          </blockquote>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 cursor-pointer" onClick={() => toggleTopic(topic)}>
                <DisplayCards cards={displayCardsData as any} />
              </div>
            )}
          </div>
        );
      })}
      
      {editingCard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Editar Hallazgo</h3>
             <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
               {(['entity','city','department','description','discovery'] as const).map(field => (
                 <div key={field}>
                  <label className="text-xs font-medium">{editFieldLabels[field] || field}</label>
                   <input
                      type="text"
                      value={(editData as any)[field] || ''}
                      onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                 </div>
               ))}
             </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingCard(null)}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Añadir hallazgo manual</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* 1. Hallazgo */}
              <div>
                <label className="text-xs font-semibold">Hallazgo</label>
                <input
                  placeholder="¿Cuál es el hallazgo principal?"
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={(createData as any).discovery || ''}
                  onChange={e => setCreateData(prev => ({ ...prev, discovery: e.target.value }))}
                />
              </div>

              {/* 2. Entidad */}
              <div>
                <label className="text-xs font-semibold">Entidad</label>
                <input
                  placeholder="Persona, institución o empresa involucrada"
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={(createData as any).entity || ''}
                  onChange={e => setCreateData(prev => ({ ...prev, entity: e.target.value }))}
                />
              </div>

              {/* 3. Descripción */}
              <div>
                <label className="text-xs font-semibold">Descripción</label>
                <input
                  placeholder="Breve explicación del hallazgo"
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={(createData as any).description || ''}
                  onChange={e => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* 4. Financiero (monto y moneda) */}
              <div className="border-t pt-3">
                <label className="text-xs font-semibold">Financiero (opcional)</label>
                <div className="mt-2 space-y-2">
                  <input
                    placeholder="Monto"
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    value={(createData as any).amount || ''}
                    onChange={e => setCreateData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900"
                    value={createData.currency || ''}
                    onChange={e => setCreateData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="">Seleccionar moneda</option>
                    <option value="Q">Quetzales (Q)</option>
                    <option value="USD">Dólares (USD)</option>
                    <option value="EUR">Euros (EUR)</option>
                    <option value="GBP">Libras (GBP)</option>
                  </select>
                </div>
              </div>

              {/* 5. Cuantificables (no monetarios) */}
              <div className="border-t pt-3">
                <label className="text-xs font-semibold">Cuantificables</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <input
                    placeholder="Contador (veces)"
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    value={(createData as any).counter || ''}
                    onChange={e => setCreateData(prev => ({ ...prev, counter: e.target.value }))}
                  />
                  <input
                    placeholder="Porcentaje (%)"
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    value={(createData as any).percentage || ''}
                    onChange={e => setCreateData(prev => ({ ...prev, percentage: e.target.value }))}
                  />
                  <input
                    placeholder="Cantidad (no monetaria)"
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    value={(createData as any).quantity || ''}
                    onChange={e => setCreateData(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              </div>

              {/* 6. Ubicación (opcional) */}
              <div className="border-t pt-3">
                <label className="text-xs font-semibold">Ubicación (opcional)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <input placeholder="Ciudad" type="text" className="w-full px-3 py-2 border rounded-md" value={(createData as any).city || ''} onChange={e => setCreateData(prev => ({ ...prev, city: e.target.value }))} />
                  <input placeholder="Departamento" type="text" className="w-full px-3 py-2 border rounded-md" value={(createData as any).department || ''} onChange={e => setCreateData(prev => ({ ...prev, department: e.target.value }))} />
                  <input placeholder="País" type="text" className="w-full px-3 py-2 border rounded-md" value={(createData as any).pais || ''} onChange={e => setCreateData(prev => ({ ...prev, pais: e.target.value }))} />
                </div>
              </div>

              {/* 7. Tiempo (duración y periodo) */}
              <div className="border-t pt-3">
                <label className="text-xs font-semibold">Tiempo (opcional)</label>
                {/* Duración avanzada: YY MM DD HH MM */}
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Duración detallada</div>
                  <div className="grid grid-cols-5 gap-2">
                    <input placeholder="Años" type="number" className="px-2 py-2 border rounded-md" value={durationYears} onChange={e => setDurationYears(e.target.value === '' ? '' : Number(e.target.value))} />
                    <input placeholder="Meses" type="number" className="px-2 py-2 border rounded-md" value={durationMonths} onChange={e => setDurationMonths(e.target.value === '' ? '' : Number(e.target.value))} />
                    <input placeholder="Días" type="number" className="px-2 py-2 border rounded-md" value={durationDays} onChange={e => setDurationDays(e.target.value === '' ? '' : Number(e.target.value))} />
                    <input placeholder="Horas" type="number" className="px-2 py-2 border rounded-md" value={durationHours} onChange={e => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))} />
                    <input placeholder="Minutos" type="number" className="px-2 py-2 border rounded-md" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                </div>

                {/* Periodo de tiempo */}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Periodo</div>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-2 border rounded-md" value={timeType} onChange={e => setTimeType(e.target.value as any)}>
                      <option value="">Seleccionar tipo</option>
                      <option value="day">Día</option>
                      <option value="year_range">Rango de años</option>
                      <option value="decade">Década</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    <select className="px-3 py-2 border rounded-md" value={timeBounds} onChange={e => setTimeBounds(e.target.value as any)}>
                      <option value="[)">[lower, upper)</option>
                      <option value="[]">[lower, upper]</option>
                      <option value="()">(lower, upper)</option>
                      <option value="(]">(lower, upper]</option>
                    </select>
                  </div>
                  {timeType === 'day' && (
                    <div className="mt-2">
                      <input type="date" className="px-3 py-2 border rounded-md" value={timeDate} onChange={e => setTimeDate(e.target.value)} />
                    </div>
                  )}
                  {timeType === 'year_range' && (
                    <div className="mt-2 flex gap-2">
                      <input placeholder="Año inicio" type="number" className="px-3 py-2 border rounded-md" value={timeStartYear} onChange={e => setTimeStartYear(e.target.value === '' ? '' : Number(e.target.value))} />
                      <input placeholder="Año fin" type="number" className="px-3 py-2 border rounded-md" value={timeEndYear} onChange={e => setTimeEndYear(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                  )}
                  {timeType === 'decade' && (
                    <div className="mt-2">
                      <input placeholder="Año de inicio de la década (ej 1990)" type="number" className="px-3 py-2 border rounded-md" value={timeDecadeStart} onChange={e => setTimeDecadeStart(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                  )}
                  {timeType === 'custom' && (
                    <div className="mt-2 flex gap-2">
                      <input type="date" className="px-3 py-2 border rounded-md" value={timeLowerDate} onChange={e => setTimeLowerDate(e.target.value)} />
                      <input type="date" className="px-3 py-2 border rounded-md" value={timeUpperDate} onChange={e => setTimeUpperDate(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Fuente */}
              <div className="border-t pt-3">
                <label className="text-xs font-semibold">Fuente (opcional)</label>
                <input
                  placeholder="Cita corta o enlace"
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={(createData as any).source || ''}
                  onChange={e => setCreateData(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowCreateModal(false); setCreateData({}); }}>Cancelar</button>
              <button
                onClick={async () => {
                  try {
                    setCreating(true);
                    const res = await createCapturadoCard(projectId, {
                      ...createData,
                      amount: createData.amount ? Number(createData.amount as any) : undefined,
                      duration_days: createData.duration_days ? Number(createData.duration_days as any) : undefined,
                      start_date: createData.start_date ? String(createData.start_date) : undefined,
                      // Duración avanzada
                      duration_years: durationYears === '' ? undefined : Number(durationYears),
                      duration_months: durationMonths === '' ? undefined : Number(durationMonths),
                      duration_hours: durationHours === '' ? undefined : Number(durationHours),
                      duration_minutes: durationMinutes === '' ? undefined : Number(durationMinutes),
                      // Tiempo/periodo
                      time_type: timeType || undefined,
                      time_date: timeDate || undefined,
                      time_start_year: timeStartYear === '' ? undefined : Number(timeStartYear),
                      time_end_year: timeEndYear === '' ? undefined : Number(timeEndYear),
                      time_decade_start_year: timeDecadeStart === '' ? undefined : Number(timeDecadeStart),
                      time_lower_date: timeLowerDate || undefined,
                      time_upper_date: timeUpperDate || undefined,
                      time_bounds: timeBounds,
                    }, session?.access_token || '');
                    setCards(prev => [res.card, ...prev]);
                    setShowCreateModal(false);
                    setCreateData({});
                    setDurationYears(''); setDurationMonths(''); setDurationDays(''); setDurationHours(''); setDurationMinutes('');
                    setTimeType(''); setTimeDate(''); setTimeStartYear(''); setTimeEndYear(''); setTimeDecadeStart(''); setTimeLowerDate(''); setTimeUpperDate(''); setTimeBounds('[)');
                  } catch (err: any) {
                    alert(`Error creando hallazgo: ${err.message || 'Desconocido'}`);
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
                className="px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 