import { TimelineEventData, EventCategory } from './InteractiveTimeline';

interface TimelineEventProps {
  event: TimelineEventData & { displayPosition: 'top' | 'bottom' };
  isHovered: boolean;
  isExpanded: boolean;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
  leftPosition: number;
  displayPosition: 'top' | 'bottom';
}

const categoryColors: Record<EventCategory, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  ring: string;
}> = {
  Political: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    dot: '#3b82f6',
    ring: 'ring-blue-400'
  },
  Social: {
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-700',
    dot: '#a855f7',
    ring: 'ring-purple-400'
  },
  Economic: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    dot: '#22c55e',
    ring: 'ring-green-400'
  },
  Crisis: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    dot: '#ef4444',
    ring: 'ring-red-400'
  }
};

export function TimelineEvent({
  event,
  isHovered,
  isExpanded,
  onHover,
  onClick,
  leftPosition,
  displayPosition
}: TimelineEventProps) {
  const colors = categoryColors[event.category];
  const isTop = displayPosition === 'top';

  // Curve configuration
  const curveHeight = 100;
  const startX = 50;
  const startY = isTop ? curveHeight : 0;
  const endX = 50;
  const endY = isTop ? 0 : curveHeight;

  // S-curve control points
  const cp1Y = isTop ? curveHeight * 0.65 : curveHeight * 0.35;
  const cp2Y = isTop ? curveHeight * 0.35 : curveHeight * 0.65;

  const curvePath = `M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`;

  return (
    <>
      {/* Only show card and curve when expanded */}
      {isExpanded && (
        <div
          className="absolute"
          style={{
            left: `${leftPosition}%`,
            transform: 'translateX(-50%)',
            top: isTop ? '0' : 'auto',
            bottom: isTop ? 'auto' : '0',
            zIndex: 150
          }}
        >
          {/* Connecting Curve */}
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: '100px',
              height: `${curveHeight}px`,
              top: isTop ? '100%' : 'auto',
              bottom: isTop ? 'auto' : '100%',
              marginTop: isTop ? '0px' : undefined,
              marginBottom: isTop ? undefined : '0px'
            }}
          >
            <svg
              width="100"
              height={curveHeight}
              viewBox={`0 0 100 ${curveHeight}`}
              className="absolute left-0 top-0"
            >
              <defs>
                <filter id={`glow-${event.id}`}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path
                d={curvePath}
                fill="none"
                stroke={colors.dot}
                strokeWidth="2.5"
                opacity="0.8"
                className="transition-all duration-300"
                filter={`url(#glow-${event.id})`}
              />
              {/* Dot at connection point */}
              <circle
                cx={endX}
                cy={endY}
                r="4"
                fill={colors.dot}
                className="transition-all duration-300"
              />
            </svg>
          </div>

          {/* Expanded Card */}
          <div
            className="cursor-pointer"
            style={{
              animation: 'expandCard 0.3s ease-out',
              marginBottom: isTop ? '10px' : '0',
              marginTop: isTop ? '0' : '10px'
            }}
            onClick={() => onClick(event.id)}
          >
            <div
              className={`bg-white rounded-2xl border-2 ${colors.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
              style={{
                width: '280px',
                maxWidth: '90vw'
              }}
            >
              <div className="p-4">
                {/* Header with category */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colors.dot }}
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>
                      {event.category}
                    </span>
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500">
                    {event.date}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-gray-900 mb-2 leading-snug">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-700 leading-relaxed">
                  {event.description}
                </p>

                {/* Additional details */}
                {event.details && (
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-2 pt-2 border-t border-gray-100">
                    {event.details}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                  Click to close
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hover tooltip (only when NOT expanded) */}
      {isHovered && !isExpanded && (
        <div
          className="absolute pointer-events-none z-[250]"
          style={{
            left: `${leftPosition}%`,
            transform: 'translateX(-50%)',
            top: isTop ? '0' : 'auto',
            bottom: isTop ? 'auto' : '0',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className={`bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-2xl max-w-xs ${
              isTop ? 'mb-2' : 'mt-2'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors.dot }}
              />
              <div>
                <div className="text-[10px] opacity-75 mb-0.5">{event.category}</div>
                <div>{event.title}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}