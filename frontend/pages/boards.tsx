import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ViewColumnsIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  ArrowRightIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

// Types
interface Project {
  id: number
  name: string
  description: string
  status: string
  progress: number
  startDate: string
  endDate: string
}

interface BoardStats {
  kanban: {
    total: number
    backlog: number
    todo: number
    inProgress: number
    review: number
    done: number
  }
  gantt: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
  }
  workUnits: {
    total: number
    inProgress: number
    completed: number
    pending: number
  }
  analytics: {
    efficiency: number
    riskScore: number
    predictedDelays: number
  }
}

// Board Type Component
const BoardTypeCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  stats, 
  color, 
  isActive = true 
}: {
  title: string
  description: string
  icon: any
  href: string
  stats?: any
  color: string
  isActive?: boolean
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-lg shadow-lg border-l-4 ${color} p-6 transition-all duration-200 ${
        isActive ? 'hover:shadow-xl cursor-pointer' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <Link href={isActive ? href : '#'} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
              <Icon className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          </div>
          {isActive && (
            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          )}
        </div>

                 {stats && (
           <div className="grid grid-cols-2 gap-4 mt-4">
             {Object.entries(stats).map(([key, value]) => (
               <div key={key} className="text-center">
                 <div className="text-2xl font-bold text-gray-900">{String(value)}</div>
                 <div className="text-xs text-gray-500 capitalize">
                   {key.replace(/([A-Z])/g, ' $1').trim()}
                 </div>
               </div>
             ))}
           </div>
         )}
      </Link>
    </motion.div>
  )
}

// Project Selector Component
const ProjectSelector = ({ 
  projects, 
  selectedProject, 
  onProjectChange 
}: {
  projects: Project[]
  selectedProject: number | null
  onProjectChange: (projectId: number) => void
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Project</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedProject === project.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onProjectChange(project.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{project.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{project.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">{project.progress}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Quick Stats Component
const QuickStats = ({ stats }: { stats: BoardStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <ViewColumnsIcon className="h-8 w-8 text-blue-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Kanban Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.kanban.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <CalendarIcon className="h-8 w-8 text-green-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Gantt Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.gantt.totalTasks}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <DocumentChartBarIcon className="h-8 w-8 text-orange-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Work Units</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.workUnits.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-8 w-8 text-purple-500" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Efficiency</p>
            <p className="text-2xl font-semibold text-gray-900">{(stats.analytics.efficiency * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Boards Page Component
export default function BoardsPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null)

  // Fetch projects
  const { data: projects } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/api/projects')
    return response.data
  })

  // Fetch board stats
  const { data: boardStats } = useQuery<BoardStats>(
    ['board-stats', selectedProject],
    async () => {
      if (!selectedProject) {
        return {
          kanban: { total: 0, backlog: 0, todo: 0, inProgress: 0, review: 0, done: 0 },
          gantt: { totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
          workUnits: { total: 0, inProgress: 0, completed: 0, pending: 0 },
          analytics: { efficiency: 0, riskScore: 0, predictedDelays: 0 }
        }
      }
      const response = await api.get(`/api/dashboard/boards/${selectedProject}`)
      return response.data
    },
    { enabled: !!selectedProject }
  )

  // Auto-select first project if available
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects, selectedProject])

  const defaultStats = {
    kanban: { total: 0, backlog: 0, todo: 0, inProgress: 0, review: 0, done: 0 },
    gantt: { totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
    workUnits: { total: 0, inProgress: 0, completed: 0, pending: 0 },
    analytics: { efficiency: 0, riskScore: 0, predictedDelays: 0 }
  }

  const stats = boardStats || defaultStats

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
          <p className="text-gray-600 mb-6">Create a project first to view the boards.</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Create Project
          </button>
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
              <h1 className="text-3xl font-bold text-gray-900">Project Boards</h1>
              <p className="text-gray-600">Choose your preferred view for project management</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Selector */}
        <ProjectSelector
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
        />

        {/* Quick Stats */}
        <QuickStats stats={stats} />

        {/* Board Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your View</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BoardTypeCard
              title="Kanban Board"
              description="Visualize and manage your project workflow with drag-and-drop task management"
              icon={ViewColumnsIcon}
              href={`/kanban?project=${selectedProject}`}
              color="border-l-blue-500"
              stats={{
                total: stats.kanban.total,
                done: stats.kanban.done
              }}
            />

            <BoardTypeCard
              title="Gantt Chart"
              description="Timeline visualization with task dependencies and project scheduling"
              icon={CalendarIcon}
              href={`/gantt?project=${selectedProject}`}
              color="border-l-green-500"
              stats={{
                total: stats.gantt.totalTasks,
                completed: stats.gantt.completedTasks
              }}
            />

            <BoardTypeCard
              title="Work Units"
              description="Process simulation and checkpoint management for different roles"
              icon={DocumentChartBarIcon}
              href={`/work-units?project=${selectedProject}`}
              color="border-l-orange-500"
              stats={{
                total: stats.workUnits.total,
                completed: stats.workUnits.completed
              }}
            />

            <BoardTypeCard
              title="Analytics Dashboard"
              description="AI-powered insights, efficiency metrics, and predictive analytics"
              icon={ChartBarIcon}
              href={`/analytics?project=${selectedProject}`}
              color="border-l-purple-500"
              stats={{
                efficiency: `${(stats.analytics.efficiency * 100).toFixed(0)}%`,
                risk: stats.analytics.riskScore.toFixed(1)
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Task "Design Review" completed</span>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Work unit "Assembly Line Design" started</span>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New task "Quality Testing" added</span>
              <span className="text-xs text-gray-400">6 hours ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 