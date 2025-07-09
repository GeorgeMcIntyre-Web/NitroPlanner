import React, { useState, useCallback, Suspense } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ProjectCreateForm from './ProjectCreateForm';
import OptimizedNavigation from './OptimizedNavigation';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

// Loading skeleton for project modal
const ProjectModalSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
  </div>
));

ProjectModalSkeleton.displayName = 'ProjectModalSkeleton';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Memoized handlers
  const handleProjectCreate = useCallback(async (data: any) => {
    setLoading(true);
    try {
      // Placeholder for API call
      await new Promise((res) => setTimeout(res, 1000));
      setProjectModalOpen(false);
      toast.success('Project created successfully!');
      // TODO: Trigger project list refresh if needed
      // e.g., queryClient.invalidateQueries('projects')
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenProjectModal = useCallback(() => {
    setProjectModalOpen(true);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setProjectModalOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Optimized Navigation */}
      <OptimizedNavigation />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar - Collapsible for better mobile experience */}
        <aside className="w-56 bg-white border-r hidden lg:block">
          <div className="p-6 sticky top-0">
            <div className="font-semibold text-gray-700 mb-4">Quick Links</div>
            <nav className="space-y-2">
              <a 
                href="/projects" 
                className="block text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors duration-200"
                tabIndex={0}
              >
                My Projects
              </a>
              <a 
                href="/kanban" 
                className="block text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors duration-200"
                tabIndex={0}
              >
                Kanban Board
              </a>
              <a 
                href="/gantt" 
                className="block text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors duration-200"
                tabIndex={0}
              >
                Gantt Chart
              </a>
              <a 
                href="/work-units" 
                className="block text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors duration-200"
                tabIndex={0}
              >
                Work Units
              </a>
              <a 
                href="/digital-twin" 
                className="block text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors duration-200"
                tabIndex={0}
              >
                Digital Twin
              </a>
              <a 
                href="/team-capacity" 
                className="block text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors duration-200"
                tabIndex={0}
              >
                Team Capacity
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <Suspense fallback={
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white text-center py-4 text-sm text-gray-400 border-t">
        <div className="max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} NitroPlanner. All rights reserved.
        </div>
      </footer>

      {/* Floating Action Button - Optimized for accessibility */}
      <Button
        variant="primary"
        className="fixed bottom-8 right-8 shadow-lg z-50 focus:ring-4 focus:ring-blue-300"
        onClick={handleOpenProjectModal}
        aria-label="Create new project"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Project
      </Button>

      {/* Project Creation Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        title="Create New Project"
        size="md"
      >
        <Suspense fallback={<ProjectModalSkeleton />}>
          <ProjectCreateForm
            onSubmit={handleProjectCreate}
            onCancel={handleCloseProjectModal}
            loading={loading}
          />
        </Suspense>
      </Modal>
    </div>
  );
};

export default React.memo(Layout); 