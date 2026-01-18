import React from 'react';
import type { WikiItem } from '@/services/wikiService';
import PersonCard from './PersonCard';
import OrganizationCard from './OrganizationCard';
import LocationCard from './LocationCard';
import EventCard from './EventCard';
import ConceptCard from './ConceptCard';

interface WikiItemCardProps {
  item: WikiItem;
  onView?: (item: WikiItem) => void;
  onEdit?: (item: WikiItem) => void;
  onDelete?: (item: WikiItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (item: WikiItem) => void;
}

const WikiItemCard: React.FC<WikiItemCardProps> = ({
  item,
  onView,
  onEdit,
  onDelete,
  selectionMode,
  isSelected,
  onSelect
}) => {
  const CardComponent = () => {
    switch (item.subcategory) {
      case 'person':
        return <PersonCard item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
      case 'organization':
        return <OrganizationCard item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
      case 'location':
        return <LocationCard item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
      case 'event':
        return <EventCard item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
      case 'concept':
        return <ConceptCard item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
      default:
        // Fallback to PersonCard for unknown types
        return <PersonCard item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
    }
  };

  if (selectionMode) {
    return (
      <div
        className={`relative rounded-lg transition-all duration-200 cursor-pointer ${isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : 'hover:ring-2 hover:ring-blue-200 hover:ring-offset-2'
          }`}
        onClick={() => onSelect && onSelect(item)}
      >
        <div className="absolute top-2 right-2 z-10 bg-white rounded-full shadow-sm">
          <div className={`
             flex items-center justify-center w-6 h-6 rounded-full border transition-colors
             ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}
           `}>
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
        {/* Disable interactions with inner card when in selection mode */}
        <div className="pointer-events-none">
          <CardComponent />
        </div>
      </div>
    );
  }

  return <CardComponent />;
};

export default WikiItemCard;
