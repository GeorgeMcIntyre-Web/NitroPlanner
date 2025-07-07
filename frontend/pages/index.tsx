import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  ViewColumnsIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

// Types
interface DashboardData {
  role: string
  total_projects: number
  active_projects: number
  active_tasks: number
  high_priority_tasks: number
  predicted_delays: number
  overdue_tasks: number
  recent_activities: any[]
  kanban_summary: {
    backlog: number
    todo: number
    in_progress: number
    review: number
    done: number
  }
}

interface Project {
  id: number
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  budget: number
  progress: number
  predicted_completion: string | null
  risk_level: string
}

interface Task {
  id: number
  project_id: number
  name: string
  description: string
  status: string
  priority: string
  assigned_to: number
  due_date: string
  estimated_hours: number
  actual_hours: number
  progress: number
  kanban_column: string
  start_date: string
  end_date: string
  dependencies: number[]
  predicted_delay: number
  risk_score: number
  confidence: number
}

// Dashboard Card Component
const DashboardCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
  >
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? '↗' : '↘'} {trendValue}
          </p>
        )}
      </div>
    </div>
  </motion.div>
)

// Feature Card Component
const FeatureCard = ({ title, description, icon: Icon, href, color }: any) => (
  <Link href={href}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-all"
    >
      <div className={`p-3 rounded-lg ${color} w-fit mb-4`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  </Link>
)

// Role Selector Component
const RoleSelector = ({ selectedRole, onRoleChange }: any) => {
  const roles = [
    'Project Manager',
    'Engineering Manager',
    'Manufacturing Engineer',
    'Quality Engineer',
    'Site Manager',
    'Sales Engineer',
    'Simulation Engineer',
    'CAD Designer',
  ]

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Your Role
      </label>
      <select
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </div>
  )
}

// Projects List Component
const ProjectsList = () => {
  const { data: projects, isLoading } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/api/projects')
    return response.data
  })

  if (isLoading) return <div className="text-center py-4">Loading projects...</div>

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
        <Link href="/projects" className="text-blue-600 hover:text-blue-800 text-sm">
          View all
        </Link>
      </div>
      <div className="divide-y divide-gray-200">
        {projects?.slice(0, 5).map((project) => (
          <div key={project.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                <p className="text-sm text-gray-500">{project.description}</p>
                <div className="flex items-center mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{project.progress}%</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  project.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
                {project.risk_level && (
                  <div className={`mt-1 text-xs px-2 py-1 rounded ${
                    project.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                    project.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.risk_level} risk
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tasks List Component
const TasksList = () => {
  const { data: tasks, isLoading } = useQuery<Task[]>('tasks', async () => {
    const response = await api.get('/api/tasks')
    return response.data
  })

  if (isLoading) return <div className="text-center py-4">Loading tasks...</div>

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">High Priority Tasks</h3>
        <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm">
          View all
        </Link>
      </div>
      <div className="divide-y divide-gray-200">
        {tasks?.filter(task => task.priority === 'high').slice(0, 5).map((task) => (
          <div key={task.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{task.name}</h4>
                <p className="text-sm text-gray-500">{task.description}</p>
                {task.predicted_delay && task.predicted_delay > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Predicted delay: {task.predicted_delay} days
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{task.progress}%</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  task.priority === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.priority}
                </span>
                {task.risk_score && task.risk_score > 0.7 && (
                  <div className="mt-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    High risk
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Kanban Summary Component
const KanbanSummary = ({ summary }: { summary: any }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Kanban Overview</h3>
    <div className="grid grid-cols-5 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-400">{summary.backlog}</div>
        <div className="text-xs text-gray-500">Backlog</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{summary.todo}</div>
        <div className="text-xs text-gray-500">To Do</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{summary.in_progress}</div>
        <div className="text-xs text-gray-500">In Progress</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{summary.review}</div>
        <div className="text-xs text-gray-500">Review</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{summary.done}</div>
        <div className="text-xs text-gray-500">Done</div>
      </div>
    </div>
  </div>
)

// Main Dashboard Component
export default function Dashboard() {
  const [selectedRole, setSelectedRole] = useState('Project Manager')

  const { data: dashboardData, isLoading } = useQuery<DashboardData>(
    ['dashboard', selectedRole],
    async () => {
      const response = await api.get(`/api/dashboard/${selectedRole}`)
      return response.data
    }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NitroPlanner</h1>
              <p className="text-gray-600">AI-Powered Automotive Project Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome back,</span>
              <span className="text-sm font-medium text-gray-900">{selectedRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Selector */}
        <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole} />

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Projects"
            value={dashboardData?.total_projects || 0}
            icon={DocumentTextIcon}
            color="bg-blue-500"
            trend="up"
            trendValue="+2 this week"
          />
          <DashboardCard
            title="Active Tasks"
            value={dashboardData?.active_tasks || 0}
            icon={CogIcon}
            color="bg-green-500"
            trend="down"
            trendValue="-5% from last week"
          />
          <DashboardCard
            title="High Priority"
            value={dashboardData?.high_priority_tasks || 0}
            icon={ExclamationTriangleIcon}
            color="bg-red-500"
          />
          <DashboardCard
            title="Predicted Delays"
            value={dashboardData?.predicted_delays || 0}
            icon={ClockIcon}
            color="bg-yellow-500"
          />
        </div>

        {/* Feature Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              title="Kanban Board"
              description="Visualize and manage your project workflow with drag-and-drop task management"
              icon={ViewColumnsIcon}
              href="/kanban"
              color="bg-blue-500"
            />
            <FeatureCard
              title="Gantt Chart"
              description="Timeline visualization with task dependencies and project scheduling"
              icon={CalendarIcon}
              href="/gantt"
              color="bg-green-500"
            />
            <FeatureCard
              title="Work Units"
              description="Process simulation and checkpoint management for different roles"
              icon={DocumentChartBarIcon}
              href="/work-units"
              color="bg-orange-500"
            />
            <FeatureCard
              title="Monte Carlo Simulation"
              description="AI-powered project completion prediction and risk analysis"
              icon={DocumentChartBarIcon}
              href="/simulation"
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-8">
              <ProjectsList />
              <TasksList />
            </div>
          </div>
          <div>
            <KanbanSummary summary={dashboardData?.kanban_summary} />
          </div>
        </div>
      </main>
    </div>
  )
} 