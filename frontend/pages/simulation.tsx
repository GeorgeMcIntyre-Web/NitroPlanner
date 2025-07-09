import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

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
  start_date: string | null
  end_date: string | null
}

interface SimulationResult {
  mean_completion: string
  std_completion: number
  p50_completion: string
  p90_completion: string
  p95_completion: string
  iterations: number
  completion_dates: string[]
}

interface SimulationHistory {
  id: number
  simulation_date: string
  iterations: number
  results: SimulationResult
}

// Simulation Controls Component
const SimulationControls = ({ projectId, onRunSimulation }: any) => {
  const [iterations, setIterations] = useState(10000)
  const [isRunning, setIsRunning] = useState(false)

  const runSimulationMutation = useMutation(
    (data: any) => api.post(`/api/simulation/${projectId}`, data),
    {
      onSuccess: (data) => {
        onRunSimulation(data.data)
        toast.success('Simulation completed successfully!')
        setIsRunning(false)
      },
      onError: () => {
        toast.error('Simulation failed')
        setIsRunning(false)
      }
    }
  )

  const handleRunSimulation = () => {
    setIsRunning(true)
    runSimulationMutation.mutate({ iterations })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Monte Carlo Simulation</h3>
        <DocumentChartBarIcon className="h-6 w-6 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Iterations
          </label>
          <select
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1000}>1,000 (Fast)</option>
            <option value={5000}>5,000 (Standard)</option>
            <option value={10000}>10,000 (Accurate)</option>
            <option value={50000}>50,000 (High Precision)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Higher iterations provide more accurate results but take longer to compute.
          </p>
        </div>
        
        <button
          onClick={handleRunSimulation}
          disabled={isRunning}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Running Simulation...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Results Visualization Component
const SimulationResults = ({ results }: { results: SimulationResult }) => {
  // Prepare data for charts
  const prepareCompletionData = () => {
    const dates = results.completion_dates.map(date => new Date(date))
    const dateCounts: { [key: string]: number } = {}
    
    dates.forEach(date => {
      const dateStr = date.toLocaleDateString()
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
    })
    
    return Object.entries(dateCounts).map(([date, count]) => ({
      date,
      count,
      percentage: (count / results.iterations) * 100
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const completionData = prepareCompletionData()

  const riskData = [
    { name: 'Low Risk', value: 30, color: '#10B981' },
    { name: 'Medium Risk', value: 45, color: '#F59E0B' },
    { name: 'High Risk', value: 25, color: '#EF4444' }
  ]

  const meanDate = new Date(results.mean_completion)
  const p50Date = new Date(results.p50_completion)
  const p90Date = new Date(results.p90_completion)
  const p95Date = new Date(results.p95_completion)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Mean Completion</p>
              <p className="text-lg font-semibold text-gray-900">
                {meanDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">50% Confidence</p>
              <p className="text-lg font-semibold text-gray-900">
                {p50Date.toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">90% Confidence</p>
              <p className="text-lg font-semibold text-gray-900">
                {p90Date.toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">95% Confidence</p>
              <p className="text-lg font-semibold text-gray-900">
                {p95Date.toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Completion Probability (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Assessment Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-lg shadow"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Standard Deviation:</span>
            <p className="font-medium">{results.std_completion.toFixed(1)} days</p>
          </div>
          <div>
            <span className="text-gray-500">Iterations:</span>
            <p className="font-medium">{results.iterations.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Confidence Range:</span>
            <p className="font-medium">
              {Math.round((p95Date.getTime() - p50Date.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
          <div>
            <span className="text-gray-500">Risk Level:</span>
            <p className={`font-medium ${
              results.std_completion > 10 ? 'text-red-600' :
              results.std_completion > 5 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {results.std_completion > 10 ? 'High' :
               results.std_completion > 5 ? 'Medium' : 'Low'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Simulation History Component
const SimulationHistory = ({ projectId }: { projectId: number }) => {
  const { data: history } = useQuery<SimulationHistory[]>(
    ['simulation-history', projectId],
    async () => {
      const response = await api.get(`/api/simulation/${projectId}/history`)
      return response.data
    },
    { enabled: !!projectId }
  )

  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation History</h3>
        <p className="text-gray-500">No previous simulations found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation History</h3>
      <div className="space-y-3">
        {history.map((sim) => (
          <div key={sim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">
                {new Date(sim.simulation_date).toLocaleDateString()} at{' '}
                {new Date(sim.simulation_date).toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-500">
                {sim.iterations.toLocaleString()} iterations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {new Date(sim.results.mean_completion).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">Mean completion</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Simulation Page Component
export default function SimulationPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null)
  const queryClient = useQueryClient()

  // Fetch projects
  const { data: projects } = useQuery<Project[]>('projects', async () => {
    const response = await api.get('/api/projects')
    return response.data
  })

  const handleRunSimulation = (results: SimulationResult) => {
    setSimulationResults(results)
    queryClient.invalidateQueries(['simulation-history', selectedProject])
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
          <p className="text-gray-600">Create a project first to run Monte Carlo simulations.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Monte Carlo Simulation</h1>
              <p className="text-gray-600">AI-powered project completion prediction and risk analysis</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Project:</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => {
                  setSelectedProject(parseInt(e.target.value))
                  setSimulationResults(null)
                }}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedProject ? (
          <div className="space-y-8">
            {/* Simulation Controls */}
            <SimulationControls 
              projectId={selectedProject} 
              onRunSimulation={handleRunSimulation} 
            />
            
            {/* Results */}
            {simulationResults && (
              <SimulationResults results={simulationResults} />
            )}
            
            {/* History */}
            <SimulationHistory projectId={selectedProject} />
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No project selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a project from the dropdown above to run Monte Carlo simulations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 