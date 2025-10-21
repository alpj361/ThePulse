import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Building2, MapPin, Calendar, Lightbulb } from 'lucide-react';

type WikiSubcategory = 'person' | 'organization' | 'location' | 'event' | 'concept' | null;

interface SubcategoryChipsProps {
  selected: WikiSubcategory;
  onSelect: (subcategory: WikiSubcategory) => void;
  counts?: {
    person: number;
    organization: number;
    location: number;
    event: number;
    concept: number;
  };
}

const SubcategoryChips: React.FC<SubcategoryChipsProps> = ({ selected, onSelect, counts }) => {
  const subcategories = [
    { id: null, label: 'Todos', icon: null, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { 
      id: 'person' as const, 
      label: 'Personas', 
      icon: User, 
      color: selected === 'person' 
        ? 'bg-blue-600 text-white hover:bg-blue-700' 
        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300'
    },
    { 
      id: 'organization' as const, 
      label: 'Organizaciones', 
      icon: Building2, 
      color: selected === 'organization' 
        ? 'bg-green-600 text-white hover:bg-green-700' 
        : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
    },
    { 
      id: 'location' as const, 
      label: 'Lugares', 
      icon: MapPin, 
      color: selected === 'location' 
        ? 'bg-red-600 text-white hover:bg-red-700' 
        : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300'
    },
    { 
      id: 'event' as const, 
      label: 'Eventos', 
      icon: Calendar, 
      color: selected === 'event' 
        ? 'bg-orange-600 text-white hover:bg-orange-700' 
        : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300'
    },
    { 
      id: 'concept' as const, 
      label: 'Conceptos', 
      icon: Lightbulb, 
      color: selected === 'concept' 
        ? 'bg-purple-600 text-white hover:bg-purple-700' 
        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300'
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-sm text-slate-500 mr-2">Tipo:</span>
      {subcategories.map((sub) => {
        const Icon = sub.icon;
        const isSelected = selected === sub.id;
        const count = sub.id && counts ? counts[sub.id] : undefined;

        return (
          <Badge
            key={sub.id || 'all'}
            onClick={() => onSelect(sub.id)}
            className={`cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-medium border ${sub.color} transition-colors`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{sub.label}</span>
            {count !== undefined && count > 0 && (
              <span className={`ml-1 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                ({count})
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
};

export default SubcategoryChips;
