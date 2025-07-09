import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface DigitalTwinData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
    email: string;
  };
  company: {
    id: string;
    name: string;
    industry: string;
  };
  professionalProfile: any;
  skills: any[];
  certifications: any[];
  availability: any;
  workloadCapacity: any;
  performanceMetrics: any;
  learningPath: any;
  currentWork: {
    workUnits: any[];
    tasks: any[];
  };
  metrics: {
    currentWorkload: number;
    capacityUtilization: number;
    skillMatch: number;
    availabilityScore: number;
    performanceTrend: string;
    overallCapacity: number;
    maxCapacity: number;
    stressLevel: string;
    energyLevel: string;
    focusLevel: string;
  };
}

// Lazy load heavy components
const DigitalTwinMetrics = React.lazy(() => import('../components/digital-twin/DigitalTwinMetrics'));
const DigitalTwinProfile = React.lazy(() => import('../components/digital-twin/DigitalTwinProfile'));
const DigitalTwinSkills = React.lazy(() => import('../components/digital-twin/DigitalTwinSkills'));
const DigitalTwinWork = React.lazy(() => import('../components/digital-twin/DigitalTwinWork'));
const DigitalTwinSidebar = React.lazy(() => import('../components/digital-twin/DigitalTwinSidebar'));

// Loading skeleton component
const LoadingSkeleton = React.memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
    <div className="max-w-7xl mx-auto px-4">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-6 md:mb-0">
          <div className="h-12 bg-gray-200 rounded-lg w-64 mb-3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Welcome component for new users
const WelcomeComponent = React.memo(({ onSetup }: { onSetup: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 flex items-center justify-center">
    <div className="max-w-xl w-full">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to Your Digital Twin
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Your Digital Twin is a comprehensive digital representation of your professional profile, 
          skills, availability, and capacity. This will help optimize work assignments and provide 
          insights into your performance and growth opportunities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Smart Assignments</h4>
            <p className="text-sm text-gray-600">Get matched with work that fits your skills and capacity</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Performance Insights</h4>
            <p className="text-sm text-gray-600">Track your progress and identify growth opportunities</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Learning Path</h4>
            <p className="text-sm text-gray-600">Personalized recommendations for skill development</p>
          </div>
        </div>
        <Button 
          onClick={onSetup}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow hover:bg-blue-700 transition w-full md:w-auto mx-auto block"
        >
          Create Your Digital Twin
        </Button>
      </div>
    </div>
  </div>
));

WelcomeComponent.displayName = 'WelcomeComponent';

// Error component
const ErrorComponent = React.memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 flex items-center justify-center">
    <div className="max-w-md w-full">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Digital Twin</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      </div>
    </div>
  </div>
));

ErrorComponent.displayName = 'ErrorComponent';

// Main Digital Twin component
const DigitalTwin: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSection, setEditSection] = useState<string>('');

  // Memoized fetch function
  const fetchDigitalTwin = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/digital-twin/me');
      
      if (response.status === 404) {
        setDigitalTwin(null);
        setShowSetupModal(true);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch digital twin data');
      }
      
      const data = await response.json();
      setDigitalTwin(data.digitalTwin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized handlers
  const handleSetupComplete = useCallback(() => {
    setShowSetupModal(false);
    fetchDigitalTwin();
  }, [fetchDigitalTwin]);

  const handleEditSection = useCallback((section: string) => {
    setEditSection(section);
    setShowEditModal(true);
  }, []);

  const handleNavigateToSetup = useCallback(() => {
    router.push('/digital-twin-setup');
  }, [router]);

  // Effects
  useEffect(() => {
    fetchDigitalTwin();
  }, [fetchDigitalTwin]);

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorComponent error={error} onRetry={fetchDigitalTwin} />;
  }

  // No digital twin state
  if (!digitalTwin) {
    return <WelcomeComponent onSetup={handleNavigateToSetup} />;
  }

  return (
    <Layout>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Digital Twin Dashboard
                  </h1>
                </div>
                <p className="text-lg text-gray-600 ml-15">
                  Welcome back, <span className="font-semibold text-blue-600">{digitalTwin.user.firstName}</span>! Here's your comprehensive digital profile.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={() => handleEditSection('profile')}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  Edit Profile
                </Button>
                <Button 
                  onClick={() => router.push('/team-capacity')}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  Team Capacity
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>}>
              <DigitalTwinMetrics metrics={digitalTwin.metrics} />
            </Suspense>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <Suspense fallback={<div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>}>
                  <DigitalTwinProfile 
                    profile={digitalTwin.professionalProfile}
                    onEdit={() => handleEditSection('profile')}
                  />
                </Suspense>

                <Suspense fallback={<div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>}>
                  <DigitalTwinSkills 
                    skills={digitalTwin.skills}
                    onEdit={() => handleEditSection('skills')}
                  />
                </Suspense>

                <Suspense fallback={<div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>}>
                  <DigitalTwinWork 
                    currentWork={digitalTwin.currentWork}
                    onNavigateToWorkUnits={() => router.push('/work-units')}
                  />
                </Suspense>
              </div>

              {/* Right Column */}
              <Suspense fallback={<div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
              </div>}>
                <DigitalTwinSidebar 
                  availability={digitalTwin.availability}
                  workloadCapacity={digitalTwin.workloadCapacity}
                  performanceMetrics={digitalTwin.performanceMetrics}
                  onEdit={handleEditSection}
                  onNavigate={router.push}
                />
              </Suspense>
            </div>
          </div>

          {/* Edit Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title={`Edit ${editSection.charAt(0).toUpperCase() + editSection.slice(1)}`}
          >
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">
                Edit functionality will be implemented in the next iteration.
              </p>
              <Button onClick={() => setShowEditModal(false)}>
                Close
              </Button>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

export default DigitalTwin; 