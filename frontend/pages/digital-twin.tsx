import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tooltip } from '../components/ui/Tooltip';
import { Modal } from '../components/ui/Modal';
import { CheckCircleIcon, UserIcon, ChartBarIcon, BoltIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

interface DigitalTwin {
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
  metrics: any;
}

export default function DigitalTwinDashboard() {
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDigitalTwin() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/digital-twin/me');
        const data = await res.json();
        setDigitalTwin(data.digitalTwin);
      } catch (err) {
        setError('Failed to load digital twin profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchDigitalTwin();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Digital Twin...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!digitalTwin) return null;

  const { user, company, professionalProfile, skills, availability, workloadCapacity, performanceMetrics, metrics, currentWork } = digitalTwin;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <UserIcon className="h-8 w-8 text-blue-600" />
        My Digital Twin
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Profile Card */}
        <Card>
          <div className="flex items-center gap-4 mb-2">
            <UserIcon className="h-10 w-10 text-blue-500" />
            <div>
              <div className="text-xl font-semibold">{user.firstName} {user.lastName}</div>
              <div className="text-gray-500">{user.role} {user.department && `| ${user.department}`}</div>
              <div className="text-gray-400 text-sm">{user.email}</div>
            </div>
          </div>
          <div className="text-gray-600 mt-2">
            <div><span className="font-medium">Company:</span> {company?.name} ({company?.industry})</div>
            <div><span className="font-medium">Experience:</span> {professionalProfile?.yearsOfExperience || 'N/A'} years</div>
            <div><span className="font-medium">Specialization:</span> {professionalProfile?.specialization || 'N/A'}</div>
            <div><span className="font-medium">Work Style:</span> {professionalProfile?.workStyle || 'N/A'}</div>
            <div><span className="font-medium">Bio:</span> {professionalProfile?.bio || 'N/A'}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary">Edit Profile</Button>
          </div>
        </Card>
        {/* Metrics Card */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-6 w-6 text-green-600" />
            <span className="font-semibold text-lg">Key Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <div className="text-2xl font-bold text-blue-700">{metrics.currentWorkload}</div>
              <div className="text-gray-500 text-sm">Current Workload</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">{metrics.skillMatch}%</div>
              <div className="text-gray-500 text-sm">Skill Match</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-700">{metrics.capacityUtilization}%</div>
              <div className="text-gray-500 text-sm">Capacity Utilization</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700">{metrics.availabilityScore}</div>
              <div className="text-gray-500 text-sm">Availability Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-700">{metrics.performanceTrend}</div>
              <div className="text-gray-500 text-sm">Performance Trend</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">{metrics.overallCapacity}</div>
              <div className="text-gray-500 text-sm">Overall Capacity</div>
            </div>
          </div>
        </Card>
      </div>
      {/* Skills & Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <BoltIcon className="h-6 w-6 text-yellow-500" />
            <span className="font-semibold text-lg">Skills</span>
          </div>
          <ul className="mt-2 space-y-1">
            {skills && skills.length > 0 ? skills.map(skill => (
              <li key={skill.id} className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="font-medium">{skill.name}</span>
                <span className="text-gray-500 text-xs">({skill.proficiency}, Level {skill.level}/10)</span>
              </li>
            )) : <li className="text-gray-400">No skills listed.</li>}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary">Add Skill</Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <BriefcaseIcon className="h-6 w-6 text-indigo-500" />
            <span className="font-semibold text-lg">Capacity & Availability</span>
          </div>
          <div className="mt-2 text-gray-600">
            <div><span className="font-medium">Status:</span> {availability?.currentStatus || 'N/A'}</div>
            <div><span className="font-medium">Work Schedule:</span> {availability?.workSchedule ? JSON.stringify(availability.workSchedule) : 'N/A'}</div>
            <div><span className="font-medium">Max Weekly Hours:</span> {workloadCapacity?.maxWeeklyHours || 'N/A'}</div>
            <div><span className="font-medium">Current Weekly Hours:</span> {workloadCapacity?.currentWeeklyHours || 'N/A'}</div>
            <div><span className="font-medium">Stress Level:</span> {workloadCapacity?.stressLevel || 'N/A'}</div>
            <div><span className="font-medium">Energy Level:</span> {workloadCapacity?.energyLevel || 'N/A'}</div>
            <div><span className="font-medium">Focus Level:</span> {workloadCapacity?.focusLevel || 'N/A'}</div>
          </div>
        </Card>
      </div>
      {/* Performance & Workload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-6 w-6 text-pink-500" />
            <span className="font-semibold text-lg">Performance Metrics</span>
          </div>
          <div className="mt-2 text-gray-600 space-y-1">
            <div><span className="font-medium">Task Completion Rate:</span> {performanceMetrics?.taskCompletionRate || 'N/A'}</div>
            <div><span className="font-medium">Quality Score:</span> {performanceMetrics?.qualityScore || 'N/A'}</div>
            <div><span className="font-medium">Efficiency Score:</span> {performanceMetrics?.efficiencyScore || 'N/A'}</div>
            <div><span className="font-medium">Collaboration Score:</span> {performanceMetrics?.collaborationScore || 'N/A'}</div>
            <div><span className="font-medium">Skill Improvement:</span> {performanceMetrics?.skillImprovement || 'N/A'}</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <BoltIcon className="h-6 w-6 text-green-500" />
            <span className="font-semibold text-lg">Current Work</span>
          </div>
          <div className="mt-2 text-gray-600">
            <div className="font-medium mb-1">Work Units:</div>
            <ul className="mb-2 list-disc list-inside text-sm">
              {currentWork.workUnits && currentWork.workUnits.length > 0 ? currentWork.workUnits.map(wu => (
                <li key={wu.id}>{wu.name} <span className="text-gray-400">({wu.status})</span></li>
              )) : <li className="text-gray-400">No active work units.</li>}
            </ul>
            <div className="font-medium mb-1">Tasks:</div>
            <ul className="list-disc list-inside text-sm">
              {currentWork.tasks && currentWork.tasks.length > 0 ? currentWork.tasks.map(task => (
                <li key={task.id}>{task.name} <span className="text-gray-400">({task.status})</span></li>
              )) : <li className="text-gray-400">No active tasks.</li>}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
} 