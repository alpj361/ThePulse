// Exportaciones principales de componentes de mapeos
export { default as MappingsTab } from './MappingsTab';
export { default as MappingCard } from './MappingCard';
export { default as CreateMappingModal } from './CreateMappingModal';
export { default as MappingDetailView } from './MappingDetailView';

// Componentes del hemiciclo
export { default as HemicicloVisualization } from './HemicicloVisualization';
export { default as HemicicloDemo } from './HemicicloDemo';
export { default as ProfessionalHemiciclo } from './ProfessionalHemiciclo';
export { default as ParliamentSeat } from './ParliamentSeat';

// Datos mock
export {
    mockHemicicloData,
    smallHemicicloData,
    generateRandomHemicicloData
} from './mockHemicicloData';

// Re-exportar tipos relacionados
export type {
    HemicicloData,
    HemicicloSeat,
    HemicicloConfig,
    HemicicloMapping
} from '../../types/mappings';