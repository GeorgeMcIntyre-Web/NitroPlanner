import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';

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

const DigitalTwin: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSection, setEditSection] = useState<string>('');

  useEffect(() => {
    fetchDigitalTwin();
  }, []);

  const fetchDigitalTwin = async () => {
    try {
      setIsLoading(true);
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
  };

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    fetchDigitalTwin();
  };

  const getCapacityColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    if (utilization >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  const getPerformanceColor = (trend: string) => {
    switch (trend) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'stable': return 'text-yellow-600';
      case 'needs_improvement': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'away': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your Digital Twin...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Digital Twin</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchDigitalTwin}>Try Again</Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!digitalTwin) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="p-8 text-center">
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
              <Button onClick={() => router.push('/digital-twin-setup')} className="px-8">
                Create Your Digital Twin
              </Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Digital Twin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {digitalTwin.user.firstName}! Here's your comprehensive digital profile.
              </p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setEditSection('profile');
                  setShowEditModal(true);
                }}
              >
                Edit Profile
              </Button>
              <Button onClick={() => router.push('/team-capacity')}>
                Team Capacity
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Workload</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {digitalTwin.metrics.currentWorkload}/{digitalTwin.metrics.maxCapacity}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Capacity Utilization</span>
                  <span className={`font-medium ${getCapacityColor(digitalTwin.metrics.capacityUtilization)}`}>
                    {digitalTwin.metrics.capacityUtilization}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${
                      digitalTwin.metrics.capacityUtilization >= 90 ? 'bg-red-500' :
                      digitalTwin.metrics.capacityUtilization >= 75 ? 'bg-yellow-500' :
                      digitalTwin.metrics.capacityUtilization >= 50 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(digitalTwin.metrics.capacityUtilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Skill Match</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {digitalTwin.metrics.skillMatch}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Performance Trend</span>
                  <span className={`font-medium ${getPerformanceColor(digitalTwin.metrics.performanceTrend)}`}>
                    {digitalTwin.metrics.performanceTrend.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Availability</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {digitalTwin.metrics.availabilityScore}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(digitalTwin.availability?.currentStatus || 'unknown')}`}>
                  {digitalTwin.availability?.currentStatus || 'Unknown'}
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Capacity</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {digitalTwin.metrics.overallCapacity}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium">Stress</div>
                    <div className="capitalize">{digitalTwin.metrics.stressLevel}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Energy</div>
                    <div className="capitalize">{digitalTwin.metrics.energyLevel}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Focus</div>
                    <div className="capitalize">{digitalTwin.metrics.focusLevel}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Professional Profile */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Professional Profile</h2>
                                     <Button 
                     variant="secondary" 
                     onClick={() => {
                       setEditSection('profile');
                       setShowEditModal(true);
                     }}
                   >
                     Edit
                   </Button>
                </div>
                {digitalTwin.professionalProfile ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        {digitalTwin.professionalProfile.title || 'No title specified'}
                      </h3>
                      <p className="text-gray-600">
                        {digitalTwin.professionalProfile.yearsOfExperience || 0} years of experience
                      </p>
                    </div>
                    {digitalTwin.professionalProfile.specialization && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Specialization</h4>
                        <p className="text-gray-600">{digitalTwin.professionalProfile.specialization}</p>
                      </div>
                    )}
                    {digitalTwin.professionalProfile.bio && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Bio</h4>
                        <p className="text-gray-600">{digitalTwin.professionalProfile.bio}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">No professional profile created yet</p>
                                         <Button 
                       variant="secondary"
                       onClick={() => {
                         setEditSection('profile');
                         setShowEditModal(true);
                       }}
                     >
                       Create Profile
                     </Button>
                  </div>
                )}
              </Card>

              {/* Skills */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Skills & Expertise</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditSection('skills');
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
                {digitalTwin.skills && digitalTwin.skills.length > 0 ? (
                  <div className="space-y-4">
                    {['technical', 'soft', 'tools', 'languages'].map(category => {
                      const categorySkills = digitalTwin.skills.filter(skill => skill.category === category);
                      if (categorySkills.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="font-medium text-gray-700 mb-2 capitalize">
                            {category} Skills ({categorySkills.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categorySkills.map((skill, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium">{skill.name}</div>
                                  <div className="text-sm text-gray-600">Level {skill.level}/10</div>
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${(skill.level / 10) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">No skills added yet</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditSection('skills');
                        setShowEditModal(true);
                      }}
                    >
                      Add Skills
                    </Button>
                  </div>
                )}
              </Card>

              {/* Current Work */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Work</h2>
                <div className="space-y-4">
                  {digitalTwin.currentWork.workUnits.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Work Units ({digitalTwin.currentWork.workUnits.length})</h3>
                      <div className="space-y-2">
                        {digitalTwin.currentWork.workUnits.map((workUnit, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <div className="font-medium">{workUnit.name}</div>
                              <div className="text-sm text-gray-600">
                                {workUnit.project?.name || 'No project'}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              workUnit.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              workUnit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {workUnit.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {digitalTwin.currentWork.tasks.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Tasks ({digitalTwin.currentWork.tasks.length})</h3>
                      <div className="space-y-2">
                        {digitalTwin.currentWork.tasks.map((task, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-gray-600">
                                {task.project?.name || 'No project'}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                              task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {digitalTwin.currentWork.workUnits.length === 0 && digitalTwin.currentWork.tasks.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">No current work assignments</p>
                      <Button variant="outline" onClick={() => router.push('/work-units')}>
                        Browse Work Units
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Availability Status */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Availability</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditSection('availability');
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
                {digitalTwin.availability ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(digitalTwin.availability.currentStatus)}`}>
                        {digitalTwin.availability.currentStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Working Hours</span>
                      <span className="text-sm font-medium">
                        {digitalTwin.availability.workingHours?.start} - {digitalTwin.availability.workingHours?.end}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Timezone</span>
                      <span className="text-sm font-medium">{digitalTwin.availability.timezone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contact Method</span>
                      <span className="text-sm font-medium capitalize">
                        {digitalTwin.availability.preferredContactMethod}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">No availability settings</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditSection('availability');
                        setShowEditModal(true);
                      }}
                    >
                      Set Availability
                    </Button>
                  </div>
                )}
              </Card>

              {/* Workload Capacity */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Workload Capacity</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditSection('capacity');
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
                {digitalTwin.workloadCapacity ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Concurrent Tasks</span>
                      <span className="text-sm font-medium">{digitalTwin.workloadCapacity.maxConcurrentTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stress Level</span>
                      <span className="text-sm font-medium capitalize">{digitalTwin.workloadCapacity.stressLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Energy Level</span>
                      <span className="text-sm font-medium capitalize">{digitalTwin.workloadCapacity.energyLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Focus Level</span>
                      <span className="text-sm font-medium capitalize">{digitalTwin.workloadCapacity.focusLevel}</span>
                    </div>
                    {digitalTwin.workloadCapacity.preferredTaskTypes && digitalTwin.workloadCapacity.preferredTaskTypes.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Preferred Task Types</span>
                        <div className="flex flex-wrap gap-1">
                          {digitalTwin.workloadCapacity.preferredTaskTypes.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">No capacity settings</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditSection('capacity');
                        setShowEditModal(true);
                      }}
                    >
                      Set Capacity
                    </Button>
                  </div>
                )}
              </Card>

              {/* Performance Metrics */}
              {digitalTwin.performanceMetrics && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Metrics</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Task Completion Rate</span>
                      <span className="text-sm font-medium">{digitalTwin.performanceMetrics.taskCompletionRate || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="text-sm font-medium">{digitalTwin.performanceMetrics.qualityScore || 0}/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Efficiency Score</span>
                      <span className="text-sm font-medium">{digitalTwin.performanceMetrics.efficiencyScore || 0}/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Collaboration Score</span>
                      <span className="text-sm font-medium">{digitalTwin.performanceMetrics.collaborationScore || 0}/10</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/work-units')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Browse Work Units
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/team-capacity')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Team Capacity
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/analytics')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Analytics
                  </Button>
                </div>
              </Card>
            </div>
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
    </Layout>
  );
};

export default DigitalTwin; 