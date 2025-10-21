import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Activity, BookOpen, Layers } from 'lucide-react';

type Category = 'all' | 'general' | 'monitoring' | 'wiki';

interface CategoryFiltersProps {
  selected: Category;
  onSelect: (category: Category) => void;
  counts?: {
    general: number;
    monitoring: number;
    wiki: number;
  };
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({ selected, onSelect, counts }) => {
  const categories = [
    { id: 'all' as Category, label: 'Todos', icon: Layers },
    { id: 'general' as Category, label: 'General', icon: FileText },
    { id: 'monitoring' as Category, label: 'Monitoreo', icon: Activity },
    { id: 'wiki' as Category, label: 'Wiki', icon: BookOpen },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selected === category.id;
        const count = category.id !== 'all' && counts ? counts[category.id as keyof typeof counts] : undefined;

        return (
          <Button
            key={category.id}
            onClick={() => onSelect(category.id)}
            variant={isSelected ? 'default' : 'outline'}
            className={`gap-2 ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{category.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilters;
