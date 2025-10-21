import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building2, MapPin, Calendar, Lightbulb, TrendingUp } from 'lucide-react';
import { getWikiStats, type WikiStats } from '@/services/wikiService';

interface WikiStatsPanelProps {
  userId: string;
}

const WikiStatsPanel: React.FC<WikiStatsPanelProps> = ({ userId }) => {
  const [stats, setStats] = useState<WikiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const data = await getWikiStats(userId);
      setStats(data);
      setLoading(false);
    };

    if (userId) {
      loadStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Estadísticas Wiki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500">Cargando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    { icon: User, label: 'Personas', count: stats.by_type.person, color: 'text-blue-600' },
    { icon: Building2, label: 'Organizaciones', count: stats.by_type.organization, color: 'text-green-600' },
    { icon: MapPin, label: 'Lugares', count: stats.by_type.location, color: 'text-red-600' },
    { icon: Calendar, label: 'Eventos', count: stats.by_type.event, color: 'text-orange-600' },
    { icon: Lightbulb, label: 'Conceptos', count: stats.by_type.concept, color: 'text-purple-600' },
  ];

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-3 border-b border-slate-200">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Estadísticas Wiki
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Total */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="text-sm text-slate-600 font-medium">Total Items</div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>

          {/* By type */}
          <div className="space-y-2">
            {statItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>

          {/* Average relevance */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Relevancia promedio</span>
              <span className="text-sm font-semibold text-slate-900">{stats.avg_relevance.toFixed(0)}/100</span>
            </div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.avg_relevance}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WikiStatsPanel;
