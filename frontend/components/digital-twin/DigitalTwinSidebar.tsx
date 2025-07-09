import React, { useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface SidebarProps {
  availability: any;
  workloadCapacity: any;
  performanceMetrics: any;
  onEdit: (section: string) => void;
  onNavigate: (path: string) => void;
}

const DigitalTwinSidebar: React.FC<SidebarProps> = ({ 
  availability, 
  workloadCapacity, 
  performanceMetrics, 
  onEdit, 
  onNavigate 
}) => {
  // Memoized status color function
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'away': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Availability Status */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-purple-900">Availability</h2>
          </div>
          <Button variant="secondary" onClick={() => onEdit('availability')}>
            Edit
          </Button>
        </div>
        {availability ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(availability.currentStatus)}`}>
                {availability.currentStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Working Hours</span>
              <span className="text-sm font-medium">
                {availability.workingHours?.start} - {availability.workingHours?.end}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Timezone</span>
              <span className="text-sm font-medium">{availability.timezone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Contact Method</span>
              <span className="text-sm font-medium capitalize">
                {availability.preferredContactMethod}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">No availability settings</p>
            <Button variant="secondary" onClick={() => onEdit('availability')}>
              Set Availability
            </Button>
          </div>
        )}
      </Card>

      {/* Workload Capacity */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-indigo-900">Workload Capacity</h2>
          </div>
          <Button variant="secondary" onClick={() => onEdit('capacity')}>
            Edit
          </Button>
        </div>
        {workloadCapacity ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Max Concurrent Tasks</span>
              <span className="text-sm font-medium">{workloadCapacity.maxConcurrentTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Stress Level</span>
              <span className="text-sm font-medium capitalize">{workloadCapacity.stressLevel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Energy Level</span>
              <span className="text-sm font-medium capitalize">{workloadCapacity.energyLevel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Focus Level</span>
              <span className="text-sm font-medium capitalize">{workloadCapacity.focusLevel}</span>
            </div>
            {workloadCapacity.preferredTaskTypes && workloadCapacity.preferredTaskTypes.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">Preferred Task Types</span>
                <div className="flex flex-wrap gap-1">
                  {workloadCapacity.preferredTaskTypes.map((type: string, index: number) => (
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
            <Button variant="secondary" onClick={() => onEdit('capacity')}>
              Set Capacity
            </Button>
          </div>
        )}
      </Card>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-green-900">Performance Metrics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Task Completion Rate</span>
              <span className="text-sm font-medium">{performanceMetrics.taskCompletionRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quality Score</span>
              <span className="text-sm font-medium">{performanceMetrics.qualityScore || 0}/10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Efficiency Score</span>
              <span className="text-sm font-medium">{performanceMetrics.efficiencyScore || 0}/10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Collaboration Score</span>
              <span className="text-sm font-medium">{performanceMetrics.collaborationScore || 0}/10</span>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-blue-900">Quick Actions</h2>
        </div>
        <div className="space-y-3">
          <Button 
            variant="secondary" 
            className="w-full justify-start"
            onClick={() => onNavigate('/work-units')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Browse Work Units
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start"
            onClick={() => onNavigate('/team-capacity')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Team Capacity
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start"
            onClick={() => onNavigate('/analytics')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(DigitalTwinSidebar); 