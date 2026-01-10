import React from 'react';
import { GeographicLocationData, ActorData, DetectedDataType } from '../../types/geographicData';
import { FiUsers, FiDatabase, FiMapPin, FiDollarSign, FiHash, FiFileText } from 'react-icons/fi';

interface EnrichedTooltipProps {
    departamento: string;
    municipio?: string;
    data: GeographicLocationData | null;
    x: number;
    y: number;
}

/**
 * Get icon for data type
 */
const getDataTypeIcon = (type: DetectedDataType['type']) => {
    switch (type) {
        case 'actor':
        case 'entity':
            return <FiUsers size={12} />;
        case 'money':
            return <FiDollarSign size={12} />;
        case 'numeric':
            return <FiHash size={12} />;
        case 'location':
            return <FiMapPin size={12} />;
        default:
            return <FiFileText size={12} />;
    }
};

/**
 * Format value for display based on type
 */
const formatValue = (dataType: DetectedDataType): string => {
    const { type, value } = dataType;

    if (value === null || value === undefined) return '-';

    if (type === 'actor' || type === 'entity') {
        if (typeof value === 'object') {
            return value.name || value.label || JSON.stringify(value);
        }
        return String(value);
    }

    if (type === 'money') {
        if (typeof value === 'object' && value.amount !== undefined) {
            const currency = value.currency || 'GTQ';
            return `${currency} ${Number(value.amount).toLocaleString()}`;
        }
        return typeof value === 'number' ? `Q${value.toLocaleString()}` : String(value);
    }

    if (type === 'numeric') {
        return typeof value === 'number' ? value.toLocaleString() : String(value);
    }

    if (type === 'location') {
        if (typeof value === 'object') {
            return value.formatted_address || value.municipality || value.name || '-';
        }
        return String(value);
    }

    return String(value);
};

/**
 * Enriched tooltip component for displaying geographic data on map hover
 */
export default function EnrichedTooltip({
    departamento,
    municipio,
    data,
    x,
    y
}: EnrichedTooltipProps) {
    // Position tooltip near cursor with fixed positioning
    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        maxWidth: '340px',
        transform: 'translate(15px, 15px)', // Offset from cursor
        transition: 'all 0.1s ease-out', // Smooth follow
        opacity: x === 0 && y === 0 ? 0 : 1 // Hide if coordinates invalid
    };

    const isMuni = !!municipio;
    const borderColor = isMuni ? 'border-purple-200' : 'border-green-200';
    const headerBg = isMuni ? 'bg-purple-50/90' : 'bg-green-50/90';
    const iconColor = isMuni ? 'text-purple-600' : 'text-green-600';

    // Render actor with photo
    const renderActor = (actor: ActorData, index: number) => {
        return (
            <div key={index} className="flex items-center gap-2 py-1.5 border-t border-gray-100 first:border-t-0">
                {/* Photo circle */}
                {actor.photoUrl ? (
                    <div className="flex-shrink-0">
                        <img
                            src={actor.photoUrl}
                            alt={actor.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                            {actor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                    </div>
                ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                        {actor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                )}

                {/* Actor info */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-xs truncate">
                        {actor.name}
                    </div>
                    {actor.role && (
                        <div className="text-[10px] text-gray-500 truncate">
                            {actor.role}
                        </div>
                    )}
                    {actor.party && (
                        <div className="text-[10px] font-medium text-blue-600 truncate">
                            {actor.party}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render generic data type item
    const renderDataType = (dataType: DetectedDataType, index: number) => {
        return (
            <div key={index} className="flex items-center gap-2 py-1 text-xs">
                <span className="text-gray-400">{getDataTypeIcon(dataType.type)}</span>
                <span className="text-gray-600 truncate">{dataType.displayName || dataType.columnName}:</span>
                <span className="font-medium text-gray-900 truncate">{formatValue(dataType)}</span>
            </div>
        );
    };

    // No data case
    if (!data || !data.hasData) {
        return (
            <div style={tooltipStyle} className="animate-in fade-in zoom-in-95 duration-200">
                <div className={`bg-white/95 backdrop-blur-md rounded-xl shadow-xl border ${borderColor} p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg p-1 rounded-md ${isMuni ? 'bg-purple-100' : 'bg-green-100'} ${iconColor}`}>
                            {isMuni ? '🏙️' : '🏛️'}
                        </span>
                        <div className="font-bold text-gray-800 text-sm">
                            {municipio || departamento}
                        </div>
                    </div>
                    {municipio && (
                        <div className="text-xs text-gray-500 mb-2 pl-9">
                            {departamento}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200 mt-2">
                        <span className="opacity-70">ℹ️</span>
                        <span>Sin datos disponibles en datasets</span>
                    </div>
                </div>
            </div>
        );
    }

    // Collect all data types from datasets (excluding actors which are shown separately)
    const allDataTypes: DetectedDataType[] = [];
    data.datasets.forEach(ds => {
        ds.dataTypes.forEach(dt => {
            if (dt.type !== 'actor' && dt.type !== 'entity') {
                // Avoid duplicates
                if (!allDataTypes.some(existing => existing.columnName === dt.columnName)) {
                    allDataTypes.push(dt);
                }
            }
        });
    });

    // Check if department level with no direct data but municipality data exists
    const hasMunicipalityDataOnly = !isMuni &&
        data.actors.length === 0 &&
        data.datasets.length === 0 &&
        data.municipalityCount &&
        data.municipalityCount > 0;

    // Has data case
    return (
        <div style={tooltipStyle} className="animate-in fade-in zoom-in-95 duration-200">
            <div className={`bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border ${borderColor} overflow-hidden ring-1 ring-black/5`}>
                {/* Header */}
                <div className={`${headerBg} p-3 border-b border-gray-200/50`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg p-1.5 rounded-lg bg-white/50 shadow-sm ${iconColor}`}>
                            {isMuni ? '🏙️' : '🏛️'}
                        </span>
                        <div className="flex-1">
                            <div className="font-bold text-gray-900 text-sm leading-tight">
                                {municipio || departamento}
                            </div>
                            {municipio && (
                                <div className="text-xs text-gray-600 font-medium">
                                    {departamento}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 max-h-64 overflow-y-auto">
                    {/* Actors section - Department or Municipality level */}
                    {data.actors.length > 0 && (
                        <div className="mb-2">
                            <div className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1 flex items-center gap-1">
                                <FiUsers size={10} /> {isMuni ? 'Nivel Municipio' : 'Nivel Departamento'}
                            </div>
                            <div className="space-y-0">
                                {data.actors.slice(0, 4).map((actor, index) => renderActor(actor, index))}
                                {data.actors.length > 4 && (
                                    <div className="text-[10px] text-gray-500 text-center pt-1">
                                        +{data.actors.length - 4} más
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Other data types section */}
                    {allDataTypes.length > 0 && (
                        <div className={data.actors.length > 0 ? 'pt-2 border-t border-gray-100' : ''}>
                            <div className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1 flex items-center gap-1">
                                <FiDatabase size={10} /> Datos
                            </div>
                            {allDataTypes.slice(0, 4).map((dt, idx) => renderDataType(dt, idx))}
                            {allDataTypes.length > 4 && (
                                <div className="text-[10px] text-gray-500 text-center pt-1">
                                    +{allDataTypes.length - 4} campos más
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message when at department level but only municipality data exists */}
                    {hasMunicipalityDataOnly && (
                        <div className="text-center py-3">
                            <div className="text-xs text-gray-500 mb-2">
                                Sin datos directos a nivel departamento
                            </div>
                            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                                <FiMapPin size={12} />
                                <span>
                                    Hay datos en {data.municipalityCount} municipio{data.municipalityCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {data.aggregatedFrom && data.aggregatedFrom.length > 0 && (
                                <div className="mt-2 text-[10px] text-gray-400">
                                    {data.aggregatedFrom.slice(0, 3).join(', ')}
                                    {data.aggregatedFrom.length > 3 && ` +${data.aggregatedFrom.length - 3} más`}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Datasets preview if no actors and has datasets */}
                    {data.datasets.length > 0 && data.actors.length === 0 && allDataTypes.length === 0 && !hasMunicipalityDataOnly && (
                        <div className="space-y-2">
                            {data.datasets.slice(0, 2).map((dataset, idx) => (
                                <div key={idx} className="text-xs">
                                    <div className="font-medium text-gray-700 mb-1">
                                        📊 {dataset.datasetName}
                                    </div>
                                    <div className="text-gray-600">
                                        {dataset.matchedRows.length} registro{dataset.matchedRows.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 border-t border-gray-100">
                    <div className="text-[10px] text-gray-500 flex items-center gap-2">
                        {data.datasets.length > 0 ? (
                            <span>{data.datasets.length} dataset{data.datasets.length !== 1 ? 's' : ''}</span>
                        ) : hasMunicipalityDataOnly ? (
                            <span className="text-purple-600">
                                {data.statistics?.municipalityActorCount || 0} registros en municipios
                            </span>
                        ) : (
                            <span>Sin datasets</span>
                        )}
                    </div>
                    <div className="text-[10px] text-blue-600 font-medium">
                        👁️ Ver más
                    </div>
                </div>
            </div>
        </div>
    );
}
