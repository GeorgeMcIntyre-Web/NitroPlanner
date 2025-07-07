import React, { useState } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ProjectCreateForm from './ProjectCreateForm';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProjectCreate = async (data: any) => {
    setLoading(true);
    // Placeholder for API call
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    setProjectModalOpen(false);
    toast.success('Project created!');
    // TODO: Trigger project list refresh if needed
    // e.g., queryClient.invalidateQueries('projects')
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-blue-700">NitroPlanner</span>
          <nav className="space-x-4">
            <a href="/" className="text-gray-700 hover:text-blue-600">Dashboard</a>
            <a href="/projects" className="text-gray-700 hover:text-blue-600">Projects</a>
            <a href="/kanban" className="text-gray-700 hover:text-blue-600">Kanban</a>
            <a href="/gantt" className="text-gray-700 hover:text-blue-600">Gantt</a>
            <a href="/work-units" className="text-gray-700 hover:text-blue-600">Work Units</a>
            <a href="/analytics" className="text-gray-700 hover:text-blue-600">Analytics</a>
            <a href="/settings" className="text-gray-700 hover:text-blue-600">Settings</a>
          </nav>
        </div>
        <div>
          {/* Placeholder for user avatar/profile dropdown */}
          <span className="text-gray-500 font-medium">User</span>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar (placeholder, can be expanded) */}
        <aside className="w-56 bg-white border-r hidden md:block">
          <div className="p-6">
            <div className="font-semibold text-gray-700 mb-4">Quick Links</div>
            <ul className="space-y-2">
              <li><a href="/projects" className="text-blue-600 hover:underline">My Projects</a></li>
              <li><a href="/kanban" className="text-blue-600 hover:underline">Kanban Board</a></li>
              <li><a href="/gantt" className="text-blue-600 hover:underline">Gantt Chart</a></li>
              <li><a href="/work-units" className="text-blue-600 hover:underline">Work Units</a></li>
            </ul>
          </div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Footer */}
      <footer className="bg-white text-center py-4 text-sm text-gray-400 border-t">
        &copy; {new Date().getFullYear()} NitroPlanner. All rights reserved.
      </footer>

      {/* Floating Action Button */}
      <Button
        variant="primary"
        className="fixed bottom-8 right-8 shadow-lg z-50"
        onClick={() => setProjectModalOpen(true)}
        aria-label="Create new project"
      >
        + New Project
      </Button>

      {/* Project Creation Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="Create New Project"
        size="md"
      >
        <ProjectCreateForm
          onSubmit={handleProjectCreate}
          onCancel={() => setProjectModalOpen(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Layout; 