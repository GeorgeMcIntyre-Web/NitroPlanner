import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import TaskCreateForm from '../components/TaskCreateForm'
import Modal from '../components/ui/Modal'

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

// Types
interface Task {
  id: number
  name: string
  description: string
  priority: string
  assigned_to: number | null
  due_date: string | null
  progress: number
  estimated_hours: number | null
  actual_hours: number | null
  predicted_delay: number | null
  risk_score: number | null
  started_at: string | null
  completed_at: string | null
  time_spent: number | null
  efficiency_score: number | null
  status: string
}

interface KanbanData {
  backlog: Task[]
  todo: Task[]
  in_progress: Task[]
  review: Task[]
  done: Task[]
}

interface Project {
  id: number
  name: string
  description: string
  status: string
}

// Kanban Column Component
const KanbanColumn = ({ title, tasks, columnId, onTaskClick, onStartTask, onCompleteTask, onAddTask }: any) => {
  const getColumnColor = (columnId: string) => {
    switch (columnId) {
      case 'backlog': return 'bg-gray-100'
      case 'todo': return 'bg-blue-100'
      case 'in_progress': return 'bg-yellow-100'
      case 'review': return 'bg-purple-100'
      case 'done': return 'bg-green-100'
      default: return 'bg-gray-100'
    }
  }

  const getColumnIcon = (columnId: string) => {
    switch (columnId) {
      case 'backlog': return <ClockIcon className="h-5 w-5" />
      case 'todo': return <PlusIcon className="h-5 w-5" />
      case 'in_progress': return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'review': return <UserIcon className="h-5 w-5" />
      case 'done': return <CheckCircleIcon className="h-5 w-5" />
      default: return <ClockIcon className="h-5 w-5" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 rounded-t-lg ${getColumnColor(columnId)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getColumnIcon(columnId)}
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
          {/* Add Task button only for Backlog column */}
          {columnId === 'backlog' && (
            <button
              onClick={onAddTask}
              className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center"
              aria-label="Add Task"
            >
              <PlusIcon className="h-4 w-4 mr-1" /> Add Task
            </button>
          )}
        </div>
      </div>
      
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 min-h-[500px] ${
              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            {tasks.map((task: Task, index: number) => (
              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-3 p-4 bg-white rounded-lg shadow-sm border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      snapshot.isDragging ? 'shadow-lg' : ''
                    } ${
                      task.priority === 'high' ? 'border-l-red-500' :
                      task.priority === 'medium' ? 'border-l-yellow-500' :
                      'border-l-green-500'
                    }`}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="p-4">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">{task.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      
                      {/* Time Tracking Information */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Estimated:</span>
                          <span className="font-medium">{task.estimated_hours || 0}h</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Actual:</span>
                          <span className="font-medium">{task.actual_hours || 0}h</span>
                        </div>
                        {task.time_spent && (
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Time Spent:</span>
                            <span className="font-medium">{task.time_spent.toFixed(1)}h</span>
                          </div>
                        )}
                        {task.efficiency_score && (
                          <div className="flex justify-between text-xs">
                            <span>Efficiency:</span>
                            <span className={`font-medium ${
                              task.efficiency_score >= 1.0 ? 'text-green-600' : 
                              task.efficiency_score >= 0.8 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {(task.efficiency_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center mb-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </div>
                      
                      {/* Task Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          {task.predicted_delay && task.predicted_delay > 0 && (
                            <span className="text-red-600">+{task.predicted_delay.toFixed(1)}d</span>
                          )}
                        </div>
                        {task.assigned_to && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            User {task.assigned_to}
                          </span>
                        )}
                      </div>
                      
                      {/* Time Tracking Controls */}
                      {task.status !== 'completed' && (
                        <div className="mt-3 flex space-x-2">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => onStartTask(task.id)}
                              className="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => onCompleteTask(task.id)}
                              className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

// Task Modal Component
const TaskModal = ({ task, isOpen, onClose, onUpdate }: any) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    progress: task?.progress || 0,
    estimated_hours: task?.estimated_hours || 0,
  })

  const updateTaskMutation = useMutation(
    (data: any) => api.put(`/api/kanban/task/${task.id}`, data),
    {
      onSuccess: () => {
        toast.success('Task updated successfully')
        onUpdate()
        onClose()
      },
      onError: () => {
        toast.error('Failed to update task')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateTaskMutation.mutate(formData)
  }

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              min="0"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              Update Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Main Kanban Component
export default function KanbanBoard() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const queryClient = useQueryClient()

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

  // Fetch kanban data
  const { data: kanbanData, refetch: refetchKanban } = useQuery<KanbanData>(
    ['kanban', selectedProject],
    async () => {
      if (!selectedProject) return { backlog: [], todo: [], in_progress: [], review: [], done: [] }
      const response = await api.get(`/api/kanban/${selectedProject}`)
      return response.data
    },
    { enabled: !!selectedProject }
  )

  // Task action handlers
  const handleStartTask = async (taskId: number) => {
    try {
      await api.post(`/api/tasks/${taskId}/start`)
      refetchKanban()
      toast.success('Task started successfully')
    } catch (error) {
      toast.error('Failed to start task')
    }
  }

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.post(`/api/tasks/${taskId}/complete`)
      refetchKanban()
      toast.success('Task completed successfully')
    } catch (error) {
      toast.error('Failed to complete task')
    }
  }

  // WebSocket connection
  useEffect(() => {
    if (selectedProject) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
      
      newSocket.on('connect', () => {
        console.log('Connected to WebSocket')
        newSocket.emit('join_project', { project_id: selectedProject })
      })
      
      newSocket.on('kanban_update', (data) => {
        console.log('Kanban update received:', data)
        refetchKanban()
        toast.success('Board updated in real-time!')
      })
      
      setSocket(newSocket)
      
      return () => {
        newSocket.close()
      }
    }
  }, [selectedProject, refetchKanban])

  // Handle drag and drop
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !selectedProject) return

    const { source, destination, draggableId } = result
    
    if (source.droppableId === destination.droppableId) return

    try {
      await api.put(`/api/kanban/task/${draggableId}`, {
        column: destination.droppableId,
        status: destination.droppableId === 'done' ? 'completed' : 'in_progress'
      })
      
      refetchKanban()
      toast.success('Task moved successfully')
    } catch (error) {
      toast.error('Failed to move task')
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  // Add Task handler
  const handleAddTask = () => setIsTaskModalOpen(true)
  const handleTaskCreate = async (data: any) => {
    setTaskLoading(true)
    // Placeholder for API call
    await new Promise((res) => setTimeout(res, 1000))
    setTaskLoading(false)
    setIsTaskModalOpen(false)
    toast.success('Task created!')
    refetchKanban()
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
          <p className="text-gray-600">Create a project first to view the Kanban board.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
              <p className="text-gray-600">Visualize and manage your project workflow</p>
            </div>
            
            <div className="flex items-center space-x-4">
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
      </header>

      {/* Kanban Board */}
      {selectedProject && kanbanData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-5 gap-6 h-full">
              <KanbanColumn
                title="Backlog"
                tasks={kanbanData.backlog}
                columnId="backlog"
                onTaskClick={handleTaskClick}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
                onAddTask={handleAddTask}
              />
              <KanbanColumn
                title="To Do"
                tasks={kanbanData.todo}
                columnId="todo"
                onTaskClick={handleTaskClick}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
              />
              <KanbanColumn
                title="In Progress"
                tasks={kanbanData.in_progress}
                columnId="in_progress"
                onTaskClick={handleTaskClick}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
              />
              <KanbanColumn
                title="Review"
                tasks={kanbanData.review}
                columnId="review"
                onTaskClick={handleTaskClick}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
              />
              <KanbanColumn
                title="Done"
                tasks={kanbanData.done}
                columnId="done"
                onTaskClick={handleTaskClick}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
              />
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onUpdate={refetchKanban}
      />

      {/* Task Create Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Task"
        size="md"
      >
        <TaskCreateForm
          onSubmit={handleTaskCreate}
          onCancel={() => setIsTaskModalOpen(false)}
          loading={taskLoading}
        />
      </Modal>
    </div>
  )
} 