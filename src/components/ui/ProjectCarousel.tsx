import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCircle } from 'react-icons/fi';
import { Project } from '../../types/projects';
import { EnhancedProjectCard } from './EnhancedProjectCard';
import { cn } from '../../lib/utils';

interface ProjectCarouselProps {
  projects: Project[];
  onView: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  decisionsCount?: (projectId: string) => number;
  assetsCount?: (projectId: string) => number;
  findingsCount?: (projectId: string) => number;
}

export function ProjectCarousel({
  projects,
  onView,
  onDelete,
  decisionsCount,
  assetsCount,
  findingsCount
}: ProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Auto-play functionality (optional)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && projects.length > 1) {
      interval = setInterval(() => {
        handleNext();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentIndex, projects.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? projects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === projects.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!projects || projects.length === 0) {
    return null;
  }

  // Show 1 card on mobile, 2 on tablet, 3 on desktop
  const cardsToShow = 1; // For carousel style, we show one prominent card at a time

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div className="relative overflow-hidden" ref={containerRef}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
            className="w-full"
          >
            <div className="max-w-4xl mx-auto px-4">
              <EnhancedProjectCard
                project={projects[currentIndex]}
                onView={onView}
                onDelete={onDelete}
                decisionsCount={decisionsCount ? decisionsCount(projects[currentIndex].id) : 0}
                assetsCount={assetsCount ? assetsCount(projects[currentIndex].id) : 0}
                findingsCount={findingsCount ? findingsCount(projects[currentIndex].id) : 0}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {projects.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-700 shadow-2xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            aria-label="Previous project"
          >
            <FiChevronLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, x: 4 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-700 shadow-2xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            aria-label="Next project"
          >
            <FiChevronRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </motion.button>
        </>
      )}

      {/* Dots Indicator */}
      {projects.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {projects.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => handleDotClick(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-12 h-3 bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500"
              )}
              aria-label={`Go to project ${index + 1}`}
            >
              {index === currentIndex && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Project Counter */}
      <div className="text-center mt-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Proyecto {currentIndex + 1} de {projects.length}
        </p>
      </div>
    </div>
  );
}

export default ProjectCarousel;
