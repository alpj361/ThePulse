import { EventCategory } from './InteractiveTimeline';

const categories: Array<{ name: EventCategory; color: string; description: string }> = [
  { name: 'Political', color: '#3b82f6', description: 'Government & Policy' },
  { name: 'Social', color: '#a855f7', description: 'Culture & Society' },
  { name: 'Economic', color: '#22c55e', description: 'Markets & Trade' },
  { name: 'Crisis', color: '#ef4444', description: 'Conflicts & Disasters' }
];

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-6 px-4">
      {categories.map((category) => (
        <div key={category.name} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: category.color }}
          />
          <div>
            <div className="text-sm font-semibold text-gray-800">
              {category.name}
            </div>
            <div className="text-xs text-gray-500">
              {category.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}