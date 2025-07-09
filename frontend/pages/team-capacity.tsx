import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  UserGroupIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface TeamMember {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
  };
  capacity: {
    currentWorkload: number;
    maxCapacity: number;
    utilization: number;
    status: string;
    availableCapacity: number;
  };
  currentWork: {
    workUnits: any[];
    tasks: any[];
  };
}

interface TeamMetrics {
  totalMembers: number;
  availableMembers: number;
  busyMembers: number;
  overloadedMembers: number;
  overallUtilization: number;
  totalCapacity: number;
  totalUtilization: number;
}

interface CapacityAlert {
  type: string;
  severity: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  message: string;
  recommendation: string;
  currentWorkload: number;
  maxCapacity: number;
}

export default function TeamCapacityDashboard() {
  const [teamCapacity, setTeamCapacity] = useState<TeamMember[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamCapacity();
    fetchCapacityAlerts();
  }, []);

  const fetchTeamCapacity = async () => {
    try {
      const res = await fetch('/api/digital-twin/team/capacity-overview');
      const data = await res.json();
      setTeamCapacity(data.teamCapacity);
      setTeamMetrics(data.teamMetrics);
    } catch (err) {
      setError('Failed to load team capacity data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCapacityAlerts = async () => {
    try {
      const res = await fetch('/api/digital-twin/team/capacity-alerts');
      const data = await res.json();
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Failed to load capacity alerts:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overloaded': return 'text-red-600 bg-red-50';
      case 'busy': return 'text-yellow-600 bg-yellow-50';
      case 'moderate': return 'text-blue-600 bg-blue-50';
      case 'available': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overloaded': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'busy': return <ClockIcon className="h-4 w-4" />;
      case 'moderate': return <ChartBarIcon className="h-4 w-4" />;
      case 'available': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <UserGroupIcon className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Team Capacity...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <UserGroupIcon className="h-8 w-8 text-blue-600" />
        Team Capacity Dashboard
      </h1>

      {/* Team Metrics Overview */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamMetrics.totalMembers}</div>
              <div className="text-gray-500 text-sm">Total Team Members</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{teamMetrics.availableMembers}</div>
              <div className="text-gray-500 text-sm">Available</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{teamMetrics.busyMembers}</div>
              <div className="text-gray-500 text-sm">Busy</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{teamMetrics.overloadedMembers}</div>
              <div className="text-gray-500 text-sm">Overloaded</div>
            </div>
          </Card>
        </div>
      )}

      {/* Overall Utilization */}
      {teamMetrics && (
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Overall Team Utilization</h3>
              <p className="text-gray-600">Current capacity usage across the team</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{teamMetrics.overallUtilization}%</div>
              <div className="text-gray-500 text-sm">
                {teamMetrics.totalUtilization} / {teamMetrics.totalCapacity} tasks
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  teamMetrics.overallUtilization >= 90 ? 'bg-red-500' :
                  teamMetrics.overallUtilization >= 75 ? 'bg-yellow-500' :
                  teamMetrics.overallUtilization >= 50 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, teamMetrics.overallUtilization)}%` }}
              ></div>
            </div>
          </div>
        </Card>
      )}

      {/* Capacity Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Capacity Alerts</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {alerts.length}
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-red-800">{alert.message}</div>
                  <div className="text-sm text-red-600">{alert.recommendation}</div>
                  <div className="text-xs text-red-500 mt-1">
                    {alert.currentWorkload}/{alert.maxCapacity} tasks assigned
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team Member Capacity */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BoltIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold">Team Member Capacity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Team Member</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Utilization</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Current Work</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Available</th>
              </tr>
            </thead>
            <tbody>
              {teamCapacity.map((member, index) => (
                <tr key={member.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{member.user.firstName} {member.user.lastName}</div>
                      <div className="text-sm text-gray-500">{member.user.department}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{member.user.role}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.capacity.status)}`}>
                      {getStatusIcon(member.capacity.status)}
                      {member.capacity.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{member.capacity.utilization}%</div>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            member.capacity.utilization >= 90 ? 'bg-red-500' :
                            member.capacity.utilization >= 75 ? 'bg-yellow-500' :
                            member.capacity.utilization >= 50 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, member.capacity.utilization)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div>{member.currentWork.workUnits.length} work units</div>
                      <div>{member.currentWork.tasks.length} tasks</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-green-600">
                      {member.capacity.availableCapacity} slots
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button onClick={fetchTeamCapacity}>
          Refresh Data
        </Button>
        <Button variant="secondary" onClick={() => window.location.href = '/work-units'}>
          View Work Units
        </Button>
        <Button variant="secondary" onClick={() => window.location.href = '/digital-twin'}>
          Individual Digital Twins
        </Button>
      </div>
    </div>
  );
} 