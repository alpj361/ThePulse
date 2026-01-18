import React, { useState, useEffect } from 'react';
import {
  FiEdit,
  FiCheckCircle,
  FiDatabase,
  FiCheckSquare,
  FiBox,
  FiLayers,
  FiArrowLeft,
  FiGrid,
  FiMap
} from 'react-icons/fi';
import { Card } from './card';
import { Project } from '../../types/projects';
import { useViewMode } from '../../context/ViewModeContext';
import ProjectInsights from './ProjectInsights';
import CapturedCards from './CapturedCards';
import ProjectCoverages from '../coverages/ProjectCoverages';
import { DatasetsTab } from './DatasetsTab';
import { MappingsTab } from './MappingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimplifiedProjectDetailProps {
  project: Project;
  onClose: () => void;
  onEdit?: () => void;
  decisionsCount?: number;
  assetsCount?: number;
  findingsCount?: number;
  tasksCompleted?: number;
  totalTasks?: number;
  children?: React.ReactNode;
}

export function SimplifiedProjectDetail({
  project,
  onClose,
  onEdit,
  decisionsCount = 0,
  assetsCount = 0,
  findingsCount = 0,
  tasksCompleted = 0,
  totalTasks = 0,
  children
}: SimplifiedProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('general');
  const { isBetaView } = useViewMode();

  // Restore tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('lastActiveTab');
    const savedProjectId = localStorage.getItem('lastActiveProjectId');

    // Only restore if it's the same project
    if (savedTab && savedProjectId === project.id) {
      setActiveTab(savedTab);
    }
  }, [project.id]);

  // Auto-switch away from hidden tabs in Beta View
  useEffect(() => {
    if (isBetaView && (activeTab === 'captured' || activeTab === 'coverages')) {
      setActiveTab('general');
    }
  }, [isBetaView, activeTab]);

  // Save tab to localStorage when it changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    localStorage.setItem('lastActiveTab', newTab);
    localStorage.setItem('lastActiveProjectId', project.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-900">
        {project.cover_image && (
          <img
            src={project.cover_image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="font-medium">Volver a Proyectos</span>
          </button>

          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit className="w-4 h-4" />
              <span className="font-medium">Editar Proyecto</span>
            </button>
          )}
        </div>

        {/* Project Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
          {project.description && (
            <p className="text-white/90 text-sm">{project.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        {/* Stats Overview Card */}
        <Card className="mb-6 border-2 border-blue-100 dark:border-blue-900/30 shadow-xl bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {decisionsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Decisiones</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {assetsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Assets</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {tasksCompleted}/{totalTasks}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tareas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {findingsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Hallazgos</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
            <TabsTrigger
              value="general"
              className="flex-1 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <FiGrid className="w-4 h-4" />
                <span>General</span>
              </div>
            </TabsTrigger>
            {!isBetaView && (
              <TabsTrigger
                value="captured"
                className="flex-1 py-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 dark:data-[state=active]:bg-orange-900/20 dark:data-[state=active]:text-orange-300 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2">
                  <FiBox className="w-4 h-4" />
                  <span>Capturados</span>
                </div>
              </TabsTrigger>
            )}
            {!isBetaView && (
              <TabsTrigger
                value="coverages"
                className="flex-1 py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/20 dark:data-[state=active]:text-teal-300 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2">
                  <FiLayers className="w-4 h-4" />
                  <span>Coberturas</span>
                </div>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="datasets"
              className="flex-1 py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/20 dark:data-[state=active]:text-purple-300 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <FiDatabase className="w-4 h-4" />
                <span>Datasets</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="mappings"
              className="flex-1 py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-300 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <FiMap className="w-4 h-4" />
                <span>Mapeos</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* General Tab Content */}
          <TabsContent value="general" className="space-y-6 pb-12 focus-visible:outline-none">
            {/* Insights Section */}
            <div id="insights-section">
              <ProjectInsights
                project={project}
                decisionsCount={decisionsCount}
                assetsCount={assetsCount}
                findingsCount={findingsCount}
                tasksCompleted={tasksCompleted}
                totalTasks={totalTasks}
              />
            </div>

            {/* Decisions Section */}
            <div id="decisions-section">
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold">Decisiones</h2>
                  </div>
                  {children && React.Children.toArray(children).find((child: any) =>
                    child?.props?.id === 'decisions-content'
                  )}
                </div>
              </Card>
            </div>

            {/* Assets Section */}
            <div id="assets-section">
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiDatabase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold">Codex y Assets</h2>
                  </div>
                  {children && React.Children.toArray(children).find((child: any) =>
                    child?.props?.id === 'assets-content'
                  )}
                </div>
              </Card>
            </div>

            {/* Tasks Section */}
            <div id="tasks-section">
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-xl font-bold">Tareas</h2>
                  </div>
                  {children && React.Children.toArray(children).find((child: any) =>
                    child?.props?.id === 'tasks-content'
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Capturados Tab Content */}
          <TabsContent value="captured" className="pb-12 focus-visible:outline-none">
            <CapturedCards projectId={project.id} />
          </TabsContent>

          {/* Coberturas Tab Content */}
          <TabsContent value="coverages" className="pb-12 focus-visible:outline-none">
            <ProjectCoverages projectId={project.id} />
          </TabsContent>

          {/* Datasets Tab Content */}
          <TabsContent value="datasets" className="pb-12 focus-visible:outline-none">
            <DatasetsTab projectId={project.id} />
          </TabsContent>

          {/* Mapeos Tab Content */}
          <TabsContent value="mappings" className="pb-12 focus-visible:outline-none">
            <MappingsTab projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SimplifiedProjectDetail;
