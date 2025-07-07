import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CogIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  DocumentTextIcon,
  PlayIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  ComputerDesktopIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

// Types
interface WorkUnit {
  id: number
  project_id: number
  name: string
  description: string
  work_unit_type: string
  role_type: string
  assigned_to: number | null
  status: string
  priority: string
  estimated_hours: number | null
  actual_hours: number | null
  progress: number
  start_date: string | null
  end_date: string | null
  dependencies: number[]
  simulation_data: any
  predicted_delay: number | null
  risk_score: number | null
  confidence: number | null
}

interface Checkpoint {
  id: number
  work_unit_id: number
  name: string
  description: string
  checkpoint_type: string
  status: string
  required_role: string
  assigned_to: number | null
  due_date: string | null
  completed_date: string | null
  notes: string | null
  attachments: any
}

interface Project {
  id: number
  name: string
  description: string
  status: string
}

// Role and Work Unit Type Icons
const getRoleIcon = (roleType: string) => {
  switch (roleType) {
    case 'mechanical_designer': return <WrenchScrewdriverIcon className="h-5 w-5" />
    case 'electrical_designer': return <BoltIcon className="h-5 w-5" />
    case 'simulation_engineer': return <ComputerDesktopIcon className="h-5 w-5" />
    case 'manufacturing_engineer': return <CogIcon className="h-5 w-5" />
    case 'quality_engineer': return <CheckCircleIcon className="h-5 w-5" />
    case 'project_manager': return <UserIcon className="h-5 w-5" />
    default: return <DocumentTextIcon className="h-5 w-5" />
  }
}

const getWorkUnitTypeIcon = (workUnitType: string) => {
  switch (workUnitType) {
    case 'design': return <DocumentTextIcon className="h-5 w-5" />
    case 'simulation': return <ComputerDesktopIcon className="h-5 w-5" />
    case 'validation': return <CheckCircleIcon className="h-5 w-5" />
    case 'manufacturing': return <CogIcon className="h-5 w-5" />
    case 'assembly': return <WrenchScrewdriverIcon className="h-5 w-5" />
    case 'testing': return <BeakerIcon className="h-5 w-5" />
    case 'documentation': return <DocumentTextIcon className="h-5 w-5" />
    default: return <DocumentTextIcon className="h-5 w-5" />
  }
}

// Work Unit Card Component
const WorkUnitCard = ({ workUnit, onSimulate, onViewCheckpoints }: any) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getWorkUnitTypeIcon(workUnit.work_unit_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{workUnit.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {getRoleIcon(workUnit.role_type)}
                <span className="capitalize">{workUnit.role_type.replace('_', ' ')}</span>
                <span>•</span>
                <span className="capitalize">{workUnit.work_unit_type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workUnit.status)}`}>
              {workUnit.status}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(workUnit.priority)}`}>
              {workUnit.priority}
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{workUnit.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Estimated:</span>
            <span className="ml-2 font-medium">{workUnit.estimated_hours || 0}h</span>
          </div>
          <div>
            <span className="text-gray-500">Actual:</span>
            <span className="ml-2 font-medium">{workUnit.actual_hours || 0}h</span>
          </div>
          <div>
            <span className="text-gray-500">Progress:</span>
            <span className="ml-2 font-medium">{workUnit.progress}%</span>
          </div>
          {workUnit.predicted_delay && workUnit.predicted_delay > 0 && (
            <div>
              <span className="text-gray-500">Delay:</span>
              <span className="ml-2 font-medium text-red-600">+{workUnit.predicted_delay}d</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${workUnit.progress}%` }}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onSimulate(workUnit.id)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center space-x-1"
            >
              <PlayIcon className="h-3 w-3" />
              <span>Simulate</span>
            </button>
            <button
              onClick={() => onViewCheckpoints(workUnit.id)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center space-x-1"
            >
              <CheckCircleIcon className="h-3 w-3" />
              <span>Checkpoints</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
          </div>
        </div>

        {isExpanded && workUnit.simulation_data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-gray-50 rounded-lg"
          >
            <h4 className="font-medium text-gray-900 mb-2">Simulation Results</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Duration:</span>
                <span className="ml-2 font-medium">{workUnit.simulation_data.total_duration}h</span>
              </div>
              <div>
                <span className="text-gray-500">Checkpoints:</span>
                <span className="ml-2 font-medium">{workUnit.simulation_data.checkpoint_results?.length || 0}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Checkpoint Modal Component
const CheckpointModal = ({ workUnitId, isOpen, onClose }: any) => {
  const { data: checkpoints, isLoading } = useQuery(
    ['checkpoints', workUnitId],
    () => api.get(`/api/work-units/${workUnitId}/checkpoints`).then(res => res.data),
    { enabled: isOpen && !!workUnitId }
  )

  const updateCheckpointMutation = useMutation(
    (data: any) => api.put(`/api/checkpoints/${data.id}`, data),
    {
      onSuccess: () => {
        toast.success('Checkpoint updated successfully')
      },
      onError: () => {
        toast.error('Failed to update checkpoint')
      }
    }
  )

  const getCheckpointTypeColor = (type: string) => {
    switch (type) {
      case 'quality_gate': return 'bg-purple-100 text-purple-800'
      case 'review': return 'bg-blue-100 text-blue-800'
      case 'validation': return 'bg-green-100 text-green-800'
      case 'test': return 'bg-orange-100 text-orange-800'
      case 'approval': return 'bg-red-100 text-red-800'
      case 'documentation': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'in_progress': return <ClockIcon className="h-5 w-5 text-blue-600" />
      case 'failed': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      default: return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Work Unit Checkpoints</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <ExclamationTriangleIcon className="h-6 w-6 transform rotate-45" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading checkpoints...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkpoints?.map((checkpoint: Checkpoint) => (
              <div key={checkpoint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(checkpoint.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{checkpoint.name}</h3>
                      <p className="text-sm text-gray-500">{checkpoint.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCheckpointTypeColor(checkpoint.checkpoint_type)}`}>
                      {checkpoint.checkpoint_type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      checkpoint.status === 'passed' ? 'bg-green-100 text-green-800' :
                      checkpoint.status === 'failed' ? 'bg-red-100 text-red-800' :
                      checkpoint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {checkpoint.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Required Role:</span>
                    <span className="ml-2 font-medium capitalize">{checkpoint.required_role?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned To:</span>
                    <span className="ml-2 font-medium">
                      {checkpoint.assigned_to ? `User ${checkpoint.assigned_to}` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {checkpoint.notes && (
                  <div className="mb-3">
                    <span className="text-gray-500 text-sm">Notes:</span>
                    <p className="text-sm text-gray-700 mt-1">{checkpoint.notes}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <select
                    value={checkpoint.status}
                    onChange={(e) => updateCheckpointMutation.mutate({
                      id: checkpoint.id,
                      status: e.target.value
                    })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Create Work Unit Modal
const CreateWorkUnitModal = ({ isOpen, onClose, onCreated }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    work_unit_type: 'design',
    role_type: 'mechanical_designer',
    use_template: true,
    priority: 'medium',
    estimated_hours: 0
  })

  const { data: projects } = useQuery('projects', () => 
    api.get('/api/projects').then(res => res.data)
  )

  const createWorkUnitMutation = useMutation(
    (data: any) => api.post('/api/work-units', data),
    {
      onSuccess: () => {
        toast.success('Work unit created successfully')
        onCreated()
        onClose()
        setFormData({
          name: '',
          description: '',
          work_unit_type: 'design',
          role_type: 'mechanical_designer',
          use_template: true,
          priority: 'medium',
          estimated_hours: 0
        })
      },
      onError: () => {
        toast.error('Failed to create work unit')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createWorkUnitMutation.mutate({
      ...formData,
      project_id: 1 // Default project for now
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Work Unit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <ExclamationTriangleIcon className="h-6 w-6 transform rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Unit Type</label>
              <select
                value={formData.work_unit_type}
                onChange={(e) => setFormData({ ...formData, work_unit_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="design">Design</option>
                <option value="simulation">Simulation</option>
                <option value="validation">Validation</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="assembly">Assembly</option>
                <option value="testing">Testing</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
              <select
                value={formData.role_type}
                onChange={(e) => setFormData({ ...formData, role_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mechanical_designer">Mechanical Designer</option>
                <option value="electrical_designer">Electrical Designer</option>
                <option value="simulation_engineer">Simulation Engineer</option>
                <option value="manufacturing_engineer">Manufacturing Engineer</option>
                <option value="quality_engineer">Quality Engineer</option>
                <option value="project_manager">Project Manager</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="use_template"
              checked={formData.use_template}
              onChange={(e) => setFormData({ ...formData, use_template: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="use_template" className="ml-2 block text-sm text-gray-900">
              Use process template with checkpoints
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Work Unit
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Main Work Units Page Component
export default function WorkUnitsPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedWorkUnitId, setSelectedWorkUnitId] = useState<number | null>(null)
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch projects
  const { data: projects } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/api/projects')
    return response.data
  })

  // Fetch work units
  const { data: workUnits, refetch: refetchWorkUnits } = useQuery<WorkUnit[]>(
    ['work-units', selectedProject],
    async () => {
      const params = selectedProject ? { project_id: selectedProject } : {}
      const response = await api.get('/api/work-units', { params })
      return response.data
    }
  )

  const simulateWorkUnitMutation = useMutation(
    (workUnitId: number) => api.post(`/api/work-units/${workUnitId}/simulate`),
    {
      onSuccess: () => {
        toast.success('Work unit simulation completed')
        refetchWorkUnits()
      },
      onError: () => {
        toast.error('Simulation failed')
      }
    }
  )

  const handleSimulate = (workUnitId: number) => {
    simulateWorkUnitMutation.mutate(workUnitId)
  }

  const handleViewCheckpoints = (workUnitId: number) => {
    setSelectedWorkUnitId(workUnitId)
    setIsCheckpointModalOpen(true)
  }

  const handleWorkUnitCreated = () => {
    refetchWorkUnits()
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
          <p className="text-gray-600">Create a project first to manage work units.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Unit of Work</h1>
              <p className="text-gray-600">Process simulation and checkpoint management</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Project:</label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Create Work Unit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Work Units</p>
                <p className="text-2xl font-semibold text-gray-900">{workUnits?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workUnits?.filter(wu => wu.status === 'in_progress').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workUnits?.filter(wu => wu.status === 'completed').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workUnits?.filter(wu => wu.priority === 'high').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Units Grid */}
        {workUnits && workUnits.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workUnits.map((workUnit) => (
              <WorkUnitCard
                key={workUnit.id}
                workUnit={workUnit}
                onSimulate={handleSimulate}
                onViewCheckpoints={handleViewCheckpoints}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No work units found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new work unit.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Work Unit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkUnitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWorkUnitCreated}
      />

      <CheckpointModal
        workUnitId={selectedWorkUnitId}
        isOpen={isCheckpointModalOpen}
        onClose={() => {
          setIsCheckpointModalOpen(false)
          setSelectedWorkUnitId(null)
        }}
      />
    </div>
  )
} 