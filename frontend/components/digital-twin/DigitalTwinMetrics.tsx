import React, { useMemo } from 'react';
import Card from '../ui/Card';

interface MetricsProps {
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

const DigitalTwinMetrics: React.FC<MetricsProps> = ({ metrics }) => {
  // Memoized color functions
  const getCapacityColor = useMemo(() => (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    if (utilization >= 50) return 'text-blue-600';
    return 'text-green-600';
  }, []);

  const getPerformanceColor = useMemo(() => (trend: string) => {
    switch (trend) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'stable': return 'text-yellow-600';
      case 'needs_improvement': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Current Workload</p>
            <p className="text-3xl font-bold text-blue-900">
              {metrics.currentWorkload}/{metrics.maxCapacity}
            </p>
          </div>
          <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-blue-700 font-medium">Capacity Utilization</span>
            <span className={`font-bold text-lg ${getCapacityColor(metrics.capacityUtilization)}`}>
              {metrics.capacityUtilization}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                metrics.capacityUtilization >= 90 ? 'bg-red-500 shadow-lg' :
                metrics.capacityUtilization >= 75 ? 'bg-yellow-500 shadow-md' :
                metrics.capacityUtilization >= 50 ? 'bg-blue-500 shadow-md' : 'bg-green-500 shadow-sm'
              }`}
              style={{ width: `${Math.min(metrics.capacityUtilization, 100)}%` }}
            ></div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700 mb-1">Skill Match</p>
            <p className="text-3xl font-bold text-green-900">
              {metrics.skillMatch}%
            </p>
          </div>
          <div className="w-14 h-14 bg-green-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700 font-medium">Performance Trend</span>
            <span className={`font-bold text-lg ${getPerformanceColor(metrics.performanceTrend)}`}>
              {metrics.performanceTrend.replace('_', ' ')}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700 mb-1">Availability</p>
            <p className="text-3xl font-bold text-purple-900">
              {metrics.availabilityScore}%
            </p>
          </div>
          <div className="w-14 h-14 bg-purple-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusColor('available')}`}>
            Available
          </span>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-700 mb-1">Overall Capacity</p>
            <p className="text-3xl font-bold text-indigo-900">
              {metrics.overallCapacity}%
            </p>
          </div>
          <div className="w-14 h-14 bg-indigo-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 bg-indigo-200 rounded-lg">
              <div className="font-semibold text-indigo-800 text-xs">Stress</div>
              <div className="capitalize text-indigo-900 font-medium">{metrics.stressLevel}</div>
            </div>
            <div className="text-center p-2 bg-indigo-200 rounded-lg">
              <div className="font-semibold text-indigo-800 text-xs">Energy</div>
              <div className="capitalize text-indigo-900 font-medium">{metrics.energyLevel}</div>
            </div>
            <div className="text-center p-2 bg-indigo-200 rounded-lg">
              <div className="font-semibold text-indigo-800 text-xs">Focus</div>
              <div className="capitalize text-indigo-900 font-medium">{metrics.focusLevel}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(DigitalTwinMetrics); 