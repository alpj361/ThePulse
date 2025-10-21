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
}

const WikiItemCard: React.FC<WikiItemCardProps> = ({ item, onView, onEdit, onDelete }) => {
  // Render the appropriate card based on subcategory
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

export default WikiItemCard;
