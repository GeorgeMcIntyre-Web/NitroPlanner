import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

// Types
interface GanttTask {
  id: number
  name: string
  start: string | null
  end: string | null
  progress: number
  dependencies: number[]
  assigned_to: number | null
  priority: string
  status: string
}

interface Project {
  id: number
  name: string
  description: string
  status: string
  start_date: string | null
  end_date: string | null
}

// Gantt Chart Component
const GanttChart = ({ tasks, project }: { tasks: GanttTask[], project: Project }) => {
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null)
  const [timelineScale, setTimelineScale] = useState('week') // day, week, month

  // Calculate timeline
  const projectStart = project.start_date ? new Date(project.start_date) : new Date()
  const projectEnd = project.end_date ? new Date(project.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Generate timeline headers
  const generateTimelineHeaders = () => {
    const headers = []
    const current = new Date(projectStart)
    
    for (let i = 0; i <= totalDays; i++) {
      if (timelineScale === 'day' || (timelineScale === 'week' && i % 7 === 0) || (timelineScale === 'month' && i % 30 === 0)) {
        headers.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            ...(timelineScale === 'month' && { year: 'numeric' })
          })
        })
      }
      current.setDate(current.getDate() + 1)
    }
    
    return headers
  }

  const timelineHeaders = generateTimelineHeaders()

  // Calculate task position and width
  const calculateTaskPosition = (task: GanttTask) => {
    if (!task.start || !task.end) return { left: 0, width: 0 }
    
    const taskStart = new Date(task.start)
    const taskEnd = new Date(task.end)
    
    const daysFromStart = Math.max(0, (taskStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
    const taskDuration = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)
    
    const left = (daysFromStart / totalDays) * 100
    const width = (taskDuration / totalDays) * 100
    
    return { left: Math.max(0, left), width: Math.max(1, width) }
  }

  const getTaskColor = (task: GanttTask) => {
    if (task.status === 'completed') return 'bg-green-500'
    if (task.priority === 'high') return 'bg-red-500'
    if (task.priority === 'medium') return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getTaskStatusIcon = (task: GanttTask) => {
    switch (task.status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'in_progress': return <ClockIcon className="h-4 w-4 text-blue-600" />
      case 'review': return <UserIcon className="h-4 w-4 text-purple-600" />
      default: return <PlusIcon className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Timeline Header */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <div className="w-64 bg-gray-50 p-4 border-r border-gray-200">
            <h3 className="font-semibold text-gray-900">Tasks</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-max">
              {timelineHeaders.map((header, index) => (
                <div
                  key={index}
                  className="w-20 p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200"
                >
                  {header.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Rows */}
      <div className="max-h-96 overflow-y-auto">
        {tasks.map((task, index) => {
          const { left, width } = calculateTaskPosition(task)
          const taskColor = getTaskColor(task)
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex border-b border-gray-100 hover:bg-gray-50"
            >
              {/* Task Info */}
              <div className="w-64 p-4 border-r border-gray-200 flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getTaskStatusIcon(task)}
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{task.name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {task.assigned_to && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          User {task.assigned_to}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Bar */}
              <div className="flex-1 relative min-h-[60px] flex items-center">
                <div className="absolute inset-0 flex items-center">
                  {task.start && task.end && (
                    <div
                      className={`absolute h-8 ${taskColor} rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-300`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-center justify-between px-3 py-1 text-white text-xs">
                        <span className="truncate">{task.name}</span>
                        <span>{task.progress}%</span>
                      </div>
                      
                      {/* Progress bar overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg">
                        <div 
                          className="bg-white bg-opacity-30 h-full rounded-lg transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <PlusIcon className="h-6 w-6 transform rotate-45" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedTask.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Task #{selectedTask.id}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTask.status}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <span className="ml-2 font-medium">{selectedTask.progress}%</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Assigned:</span>
                  <span className="ml-2">
                    {selectedTask.assigned_to ? `User ${selectedTask.assigned_to}` : 'Unassigned'}
                  </span>
                </div>
              </div>
              
              {selectedTask.start && selectedTask.end && (
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">Timeline:</div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div>Start: {new Date(selectedTask.start).toLocaleDateString()}</div>
                    <div>End: {new Date(selectedTask.end).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
              
              {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">Dependencies:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.dependencies.map((depId) => (
                      <span key={depId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Task #{depId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Main Gantt Page Component
export default function GanttPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [timelineScale, setTimelineScale] = useState('week')

  // Fetch projects
  const { data: projects } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/api/projects')
    return response.data
  })

  // Auto-select first project if available
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects, selectedProject])

  // Fetch gantt data
  const { data: ganttTasks } = useQuery<GanttTask[]>(
    ['gantt', selectedProject],
    async () => {
      if (!selectedProject) return []
      const response = await api.get(`/api/gantt/${selectedProject}`)
      return response.data
    },
    { enabled: !!selectedProject }
  )

  const selectedProjectData = projects?.find(p => p.id === selectedProject)

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
          <p className="text-gray-600">Create a project first to view the Gantt chart.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Gantt Chart</h1>
              <p className="text-gray-600">Visualize project timeline and dependencies</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Scale:</label>
                <select
                  value={timelineScale}
                  onChange={(e) => setTimelineScale(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Project:</label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Gantt Chart */}
      {selectedProject && ganttTasks && selectedProjectData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedProjectData.name}
            </h2>
            <p className="text-gray-600">{selectedProjectData.description}</p>
          </div>
          
          <GanttChart tasks={ganttTasks} project={selectedProjectData} />
          
          {/* Project Statistics */}
          <div className="mt-8 grid grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{ganttTasks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ganttTasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ganttTasks.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">High Priority</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ganttTasks.filter(t => t.priority === 'high').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedProject && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No project selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a project from the dropdown above to view its Gantt chart.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 