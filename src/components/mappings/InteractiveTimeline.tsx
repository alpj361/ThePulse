import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimelineEvent } from './TimelineEvent';
import { TimelineLegend } from './TimelineLegend';

export type EventCategory = 'Political' | 'Social' | 'Economic' | 'Crisis';

export interface TimelineEventData {
  id: number;
  date: string;
  month: string;
  year: number;
  category: EventCategory;
  title: string;
  description: string;
  details?: string;
}

// Extended timeline data spanning multiple years
const timelineData: TimelineEventData[] = [
  // 2020
  { id: 1, date: 'Mar 2020', month: 'Mar', year: 2020, category: 'Crisis', title: 'Global Pandemic Declared', description: 'WHO declares COVID-19 a global pandemic. Worldwide lockdowns begin.', details: 'The coronavirus outbreak that started in late 2019 is officially declared a pandemic, affecting over 100 countries with unprecedented global health measures.' },
  { id: 2, date: 'Jun 2020', month: 'Jun', year: 2020, category: 'Social', title: 'Massive Social Movement', description: 'Worldwide protests for social justice and equality reach historic levels.', details: 'Following tragic events, millions take to the streets globally demanding systemic change and racial justice reform.' },
  { id: 3, date: 'Nov 2020', month: 'Nov', year: 2020, category: 'Political', title: 'Historic Election', description: 'Record voter turnout in major democratic elections worldwide.', details: 'Despite pandemic challenges, democratic processes continue with unprecedented mail-in and early voting participation.' },

  // 2021
  { id: 4, date: 'Jan 2021', month: 'Jan', year: 2021, category: 'Social', title: 'Vaccine Rollout Begins', description: 'Mass vaccination campaigns launch globally.', details: 'Multiple vaccine candidates receive emergency approval and distribution begins to priority populations worldwide.' },
  { id: 5, date: 'Apr 2021', month: 'Apr', year: 2021, category: 'Economic', title: 'Economic Recovery Package', description: 'Trillion-dollar stimulus programs implemented.', details: 'Governments worldwide approve massive economic relief packages to support businesses and individuals affected by pandemic.' },
  { id: 6, date: 'Jul 2021', month: 'Jul', year: 2021, category: 'Social', title: 'Olympic Games Adaptation', description: 'First pandemic-era Olympics held with strict protocols.', details: 'Tokyo Olympics proceed with no spectators and comprehensive safety measures, showcasing global resilience.' },
  { id: 7, date: 'Nov 2021', month: 'Nov', year: 2021, category: 'Political', title: 'Climate Summit Agreements', description: 'COP26 results in new global climate commitments.', details: 'Nearly 200 countries agree to strengthen climate action with focus on reducing emissions and supporting vulnerable nations.' },

  // 2022
  { id: 8, date: 'Feb 2022', month: 'Feb', year: 2022, category: 'Crisis', title: 'Eastern European Conflict', description: 'Major military conflict erupts in Eastern Europe.', details: 'Geopolitical tensions escalate into armed conflict, causing humanitarian crisis and global economic disruption.' },
  { id: 9, date: 'May 2022', month: 'May', year: 2022, category: 'Economic', title: 'Inflation Surge', description: 'Global inflation reaches 40-year highs.', details: 'Supply chain disruptions and energy prices drive inflation worldwide, prompting central bank interventions.' },
  { id: 10, date: 'Sep 2022', month: 'Sep', year: 2022, category: 'Crisis', title: 'Energy Crisis', description: 'European energy crisis intensifies.', details: 'Natural gas shortages and soaring prices force emergency conservation measures across Europe.' },
  { id: 11, date: 'Nov 2022', month: 'Nov', year: 2022, category: 'Social', title: 'World Cup Unity', description: 'Global sporting event brings nations together.', details: 'Despite controversies, the FIFA World Cup creates moments of international unity and cultural exchange.' },

  // 2023
  { id: 12, date: 'Feb 2023', month: 'Feb', year: 2023, category: 'Crisis', title: 'Devastating Earthquakes', description: 'Major earthquakes strike Turkey and Syria.', details: 'Powerful earthquakes cause massive casualties and destruction, triggering international humanitarian response.' },
  { id: 13, date: 'Mar 2023', month: 'Mar', year: 2023, category: 'Economic', title: 'Banking Sector Turmoil', description: 'Regional bank failures spark financial concerns.', details: 'Silicon Valley Bank collapse leads to market volatility and regulatory scrutiny of banking sector.' },
  { id: 14, date: 'Jun 2023', month: 'Jun', year: 2023, category: 'Social', title: 'AI Revolution Accelerates', description: 'Generative AI transforms industries.', details: 'ChatGPT and similar technologies reach mainstream adoption, sparking debates about AI regulation and impact.' },
  { id: 15, date: 'Aug 2023', month: 'Aug', year: 2023, category: 'Crisis', title: 'Wildfire Season Intensifies', description: 'Record wildfires across multiple continents.', details: 'Extreme heat and drought conditions fuel devastating wildfires in Canada, Greece, and Hawaii.' },
  { id: 16, date: 'Oct 2023', month: 'Oct', year: 2023, category: 'Crisis', title: 'Middle East Conflict', description: 'Regional tensions escalate dramatically.', details: 'Conflict in Gaza intensifies, raising humanitarian concerns and diplomatic challenges worldwide.' },

  // 2024
  { id: 17, date: 'Jan 2024', month: 'Jan', year: 2024, category: 'Political', title: 'Major Election Year Begins', description: 'Over 60 countries hold elections.', details: 'Historic year for democracy with elections affecting over half of world population.' },
  { id: 18, date: 'Mar 2024', month: 'Mar', year: 2024, category: 'Economic', title: 'Digital Currency Advances', description: 'Central banks pilot digital currencies.', details: 'Multiple nations launch CBDC programs, reshaping future of monetary systems.' },
  { id: 19, date: 'May 2024', month: 'May', year: 2024, category: 'Social', title: 'Eurovision Cultural Event', description: 'International music competition celebrates diversity.', details: 'Major cultural event draws record viewership, highlighting European unity through music.' },
  { id: 20, date: 'Jul 2024', month: 'Jul', year: 2024, category: 'Social', title: 'Paris Olympics Success', description: 'Summer Olympics return to Paris after 100 years.', details: 'Spectacular opening ceremony and athletic achievements capture global attention.' },
  { id: 21, date: 'Sep 2024', month: 'Sep', year: 2024, category: 'Economic', title: 'Rate Cut Cycle Begins', description: 'Central banks start lowering interest rates.', details: 'Federal Reserve initiates rate cuts as inflation moderates, signaling economic shift.' },
  { id: 22, date: 'Nov 2024', month: 'Nov', year: 2024, category: 'Political', title: 'US Presidential Election', description: 'Americans choose leadership for next four years.', details: 'High-stakes election with significant implications for domestic and foreign policy.' },

  // 2025
  { id: 23, date: 'Jan 2025', month: 'Jan', year: 2025, category: 'Political', title: 'Leadership Transitions', description: 'New administrations take office worldwide.', details: 'Political transitions mark beginning of new policy directions across major democracies.' },
  { id: 24, date: 'Mar 2025', month: 'Mar', year: 2025, category: 'Economic', title: 'AI Investment Boom', description: 'Tech sector sees record AI investments.', details: 'Over $500B invested in AI infrastructure and development, transforming industries.' },
  { id: 25, date: 'May 2025', month: 'May', year: 2025, category: 'Social', title: 'Space Tourism Milestone', description: 'Commercial space travel becomes accessible.', details: 'First regular civilian flights to space stations mark new era of space exploration.' },
  { id: 26, date: 'Jul 2025', month: 'Jul', year: 2025, category: 'Economic', title: 'Green Energy Breakthrough', description: 'Renewable energy reaches 50% of global mix.', details: 'Solar and wind power achieve cost parity with fossil fuels worldwide.' },
  { id: 27, date: 'Sep 2025', month: 'Sep', year: 2025, category: 'Political', title: 'UN Climate Action', description: 'New international climate framework adopted.', details: 'UN member states commit to enhanced emissions targets and climate financing.' },

  // 2026
  { id: 28, date: 'Jan 2026', month: 'Jan', year: 2026, category: 'Social', title: 'Global Health Initiative', description: 'WHO launches disease prevention program.', details: 'Comprehensive vaccination and health education program targeting preventable diseases worldwide.' }
];

export function InteractiveTimeline() {
  const [currentYear, setCurrentYear] = useState(2024);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const availableYears = Array.from(new Set(timelineData.map(e => e.year))).sort();
  const currentYearIndex = availableYears.indexOf(currentYear);

  const handlePrevYear = () => {
    if (currentYearIndex > 0) {
      setCurrentYear(availableYears[currentYearIndex - 1]);
      setExpandedEvents([]);
    }
  };

  const handleNextYear = () => {
    if (currentYearIndex < availableYears.length - 1) {
      setCurrentYear(availableYears[currentYearIndex + 1]);
      setExpandedEvents([]);
    }
  };

  const handleEventClick = (id: number) => {
    setExpandedEvents(prev =>
      prev.includes(id)
        ? prev.filter(eventId => eventId !== id)
        : [...prev, id]
    );
  };

  // Filter events for current year
  const yearEvents = timelineData.filter(e => e.year === currentYear);

  // Assign positions (top/bottom) to events based on their order
  const eventsWithPositions = yearEvents.map((event, index) => ({
    ...event,
    displayPosition: index % 2 === 0 ? 'top' : 'bottom'
  }));

  // Get all months for the year
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Global Events Timeline</h1>
        <p className="text-gray-600">Interactive Historical Timeline</p>
      </div>

      {/* Legend */}
      <TimelineLegend />

      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-6 mt-8 mb-6">
        <button
          onClick={handlePrevYear}
          disabled={currentYearIndex === 0}
          className="p-3 rounded-full bg-white border-2 border-gray-300 hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg disabled:hover:border-gray-300"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl shadow-lg min-w-[200px] text-center">
          <div className="text-sm font-semibold opacity-90">Viewing Year</div>
          <div className="text-3xl font-bold">{currentYear}</div>
        </div>

        <button
          onClick={handleNextYear}
          disabled={currentYearIndex === availableYears.length - 1}
          className="p-3 rounded-full bg-white border-2 border-gray-300 hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg disabled:hover:border-gray-300"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Year Progress Indicator */}
      <div className="flex justify-center gap-2 mb-8">
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => {
              setCurrentYear(year);
              setExpandedEvents([]);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              year === currentYear
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Timeline Container */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 shadow-lg overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="relative w-full"
          style={{ minHeight: '600px' }}
        >
          <div className="relative" style={{ minWidth: '100%' }}>

            {/* Events Above Timeline */}
            <div className="absolute top-0 left-0 right-0" style={{ height: '240px' }}>
              {eventsWithPositions
                .filter(e => e.displayPosition === 'top')
                .map((event) => {
                  const monthIndex = months.indexOf(event.month);
                  const leftPosition = (monthIndex / 11) * 100;

                  return (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      isHovered={hoveredEvent === event.id}
                      isExpanded={expandedEvents.includes(event.id)}
                      onHover={setHoveredEvent}
                      onClick={handleEventClick}
                      leftPosition={leftPosition}
                      displayPosition="top"
                    />
                  );
                })}
            </div>

            {/* Main Timeline Line */}
            <div className="absolute left-0 right-0" style={{ top: '250px' }}>
              <div className="relative h-6 rounded-full overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 to-orange-400" />

                {/* Event Circles ON the timeline */}
                {eventsWithPositions.map((event) => {
                  const monthIndex = months.indexOf(event.month);
                  const leftPosition = (monthIndex / 11) * 100;
                  const isExpanded = expandedEvents.includes(event.id);
                  const isHovered = hoveredEvent === event.id;

                  return (
                    <TimelineCircle
                      key={event.id}
                      event={event}
                      isHovered={isHovered}
                      isExpanded={isExpanded}
                      onHover={setHoveredEvent}
                      onClick={handleEventClick}
                      leftPosition={leftPosition}
                    />
                  );
                })}
              </div>

              {/* Month Markers */}
              <div className="relative h-16 mt-2">
                {months.map((month, index) => {
                  const leftPosition = (index / 11) * 100;

                  return (
                    <div
                      key={month}
                      className="absolute"
                      style={{
                        left: `${leftPosition}%`,
                        transform: 'translateX(-50%)',
                        top: '0'
                      }}
                    >
                      {/* Tick mark */}
                      <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gray-300" style={{ top: '-20px' }} />

                      {/* Month label */}
                      <div className="text-center pt-2">
                        <div className="text-xs font-semibold text-gray-700">{month}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Events Below Timeline */}
            <div className="absolute left-0 right-0" style={{ top: '310px', height: '240px' }}>
              {eventsWithPositions
                .filter(e => e.displayPosition === 'bottom')
                .map((event) => {
                  const monthIndex = months.indexOf(event.month);
                  const leftPosition = (monthIndex / 11) * 100;

                  return (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      isHovered={hoveredEvent === event.id}
                      isExpanded={expandedEvents.includes(event.id)}
                      onHover={setHoveredEvent}
                      onClick={handleEventClick}
                      leftPosition={leftPosition}
                      displayPosition="bottom"
                    />
                  );
                })}
            </div>
          </div>
        </div>

        {/* Event Count */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''} in {currentYear}
          {expandedEvents.length > 0 && ` • ${expandedEvents.length} expanded`}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mt-6 text-sm text-gray-500">
        Use arrows to navigate years • Click circles to expand multiple events
      </div>
    </div>
  );
}

// Separate component for the circle on the timeline
function TimelineCircle({
  event,
  isHovered,
  isExpanded,
  onHover,
  onClick,
  leftPosition
}: {
  event: TimelineEventData & { displayPosition: 'top' | 'bottom' };
  isHovered: boolean;
  isExpanded: boolean;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
  leftPosition: number;
}) {
  const categoryColors: Record<EventCategory, string> = {
    Political: '#3b82f6',
    Social: '#a855f7',
    Economic: '#22c55e',
    Crisis: '#ef4444'
  };

  const color = categoryColors[event.category];

  return (
    <div
      className="absolute transition-all duration-300"
      style={{
        left: `${leftPosition}%`,
        transform: 'translate(-50%, -50%)',
        top: '50%',
        zIndex: isExpanded ? 200 : isHovered ? 150 : 100
      }}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(event.id)}
    >
      <div
        className="cursor-pointer transition-all duration-300 rounded-full relative"
        style={{
          width: isExpanded ? '22px' : isHovered ? '20px' : '16px',
          height: isExpanded ? '22px' : isHovered ? '20px' : '16px',
          backgroundColor: color,
          boxShadow: isExpanded
            ? `0 0 0 6px ${color}20, 0 6px 12px ${color}40`
            : isHovered
            ? `0 0 0 4px ${color}15, 0 4px 8px ${color}30`
            : `0 2px 4px ${color}25`,
          border: isExpanded ? '3px solid white' : '2px solid white'
        }}
      >
        {/* Pulse animation on hover */}
        {isHovered && !isExpanded && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    </div>
  );
}