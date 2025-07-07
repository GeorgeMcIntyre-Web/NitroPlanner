import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  UserGroupIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

// Types
interface EfficiencyAnalytics {
  overall_efficiency: number
  recent_efficiency: number
  role_efficiency: Record<string, number>
  task_type_efficiency: Record<string, number>
  total_completed_tasks: number
  recent_completed_tasks: number
  improvement_trend: string
}

interface ImprovementSuggestion {
  type: string
  message: string
  severity: string
}

// Analytics Card Component
const AnalyticsCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow p-6"
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend === 'up' ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? 'Improving' : 'Declining'}
            </span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)

// Efficiency Chart Component
const EfficiencyChart = ({ data, title }: any) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="efficiency" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

// Improvement Suggestions Component
const ImprovementSuggestions = ({ suggestions }: { suggestions: ImprovementSuggestion[] }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center mb-4">
      <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
      <h3 className="text-lg font-medium text-gray-900">AI Improvement Suggestions</h3>
    </div>
    
    {suggestions.length === 0 ? (
      <div className="text-center py-8">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-gray-600">No improvement suggestions at this time. Keep up the good work!</p>
      </div>
    ) : (
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-l-4 ${
              suggestion.severity === 'high' ? 'border-red-500 bg-red-50' :
              suggestion.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start">
              {suggestion.severity === 'high' ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              ) : (
                <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {suggestion.type === 'estimate_adjustment' ? 'Estimate Adjustment' : 'Risk Mitigation'}
                </p>
                <p className="text-sm text-gray-600">{suggestion.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
)

// Main Analytics Component
export default function AnalyticsPage() {
  const [selectedTaskType, setSelectedTaskType] = useState('design')
  const [selectedRole, setSelectedRole] = useState('mechanical_designer')

  // Fetch efficiency analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<EfficiencyAnalytics>(
    'efficiency-analytics',
    async () => {
      const response = await api.get('/api/analytics/efficiency')
      return response.data
    }
  )

  // Fetch improvement suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery<{suggestions: ImprovementSuggestion[]}>(
    ['improvement-suggestions', selectedTaskType, selectedRole],
    async () => {
      const response = await api.post('/api/ai/improvement-suggestions', {
        task_type: selectedTaskType,
        role_type: selectedRole
      })
      return response.data
    }
  )

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const roleEfficiencyData = analytics?.role_efficiency ? 
    Object.entries(analytics.role_efficiency).map(([role, efficiency]) => ({
      name: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      efficiency: (efficiency * 100).toFixed(1)
    })) : []

  const taskTypeEfficiencyData = analytics?.task_type_efficiency ?
    Object.entries(analytics.task_type_efficiency).map(([type, efficiency]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      efficiency: (efficiency * 100).toFixed(1)
    })) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600">Track efficiency and get AI-powered improvement suggestions</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Overall Efficiency"
            value={`${((analytics?.overall_efficiency || 1) * 100).toFixed(1)}%`}
            subtitle="Based on all completed tasks"
            icon={ChartBarIcon}
            color="bg-blue-500"
            trend={analytics?.improvement_trend === 'improving' ? 'up' : 'down'}
          />
          
          <AnalyticsCard
            title="Recent Efficiency"
            value={`${((analytics?.recent_efficiency || 1) * 100).toFixed(1)}%`}
            subtitle="Last 30 days"
            icon={TrendingUpIcon}
            color="bg-green-500"
            trend={analytics?.improvement_trend === 'improving' ? 'up' : 'down'}
          />
          
          <AnalyticsCard
            title="Completed Tasks"
            value={analytics?.total_completed_tasks || 0}
            subtitle={`${analytics?.recent_completed_tasks || 0} in last 30 days`}
            icon={CheckCircleIcon}
            color="bg-purple-500"
          />
          
          <AnalyticsCard
            title="Improvement Trend"
            value={analytics?.improvement_trend === 'improving' ? 'Improving' : 
                   analytics?.improvement_trend === 'declining' ? 'Declining' : 'Stable'}
            subtitle="Based on recent performance"
            icon={analytics?.improvement_trend === 'improving' ? TrendingUpIcon : TrendingDownIcon}
            color={analytics?.improvement_trend === 'improving' ? 'bg-green-500' : 'bg-red-500'}
          />
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <EfficiencyChart
            data={roleEfficiencyData}
            title="Efficiency by Role"
          />
          
          <EfficiencyChart
            data={taskTypeEfficiencyData}
            title="Efficiency by Task Type"
          />
        </div>

        {/* Improvement Suggestions */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Get Personalized Suggestions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                <select
                  value={selectedTaskType}
                  onChange={(e) => setSelectedTaskType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="design">Design</option>
                  <option value="simulation">Simulation</option>
                  <option value="validation">Validation</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="testing">Testing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mechanical_designer">Mechanical Designer</option>
                  <option value="electrical_designer">Electrical Designer</option>
                  <option value="simulation_engineer">Simulation Engineer</option>
                  <option value="project_manager">Project Manager</option>
                </select>
              </div>
            </div>
          </div>
          
          <ImprovementSuggestions suggestions={suggestionsData?.suggestions || []} />
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Efficiency Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Overall efficiency: {((analytics?.overall_efficiency || 1) * 100).toFixed(1)}%</li>
                <li>• Recent trend: {analytics?.improvement_trend || 'stable'}</li>
                <li>• Total tasks analyzed: {analytics?.total_completed_tasks || 0}</li>
                <li>• Recent tasks: {analytics?.recent_completed_tasks || 0}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Track time consistently for better predictions</li>
                <li>• Review estimates based on historical data</li>
                <li>• Consider team experience levels in planning</li>
                <li>• Monitor efficiency trends regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 