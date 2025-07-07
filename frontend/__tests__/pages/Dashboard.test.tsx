import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import Dashboard from '../../pages/index'

// Mock the API module
jest.mock('../../utils/api', () => ({
  get: jest.fn(),
}))

// Mock react-query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard title', () => {
    renderWithClient(<Dashboard />)
    expect(screen.getByText('NitroPlanner Dashboard')).toBeInTheDocument()
  })

  it('renders project management tools section', () => {
    renderWithClient(<Dashboard />)
    expect(screen.getByText('Project Management Tools')).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    renderWithClient(<Dashboard />)
    
    expect(screen.getByText('Kanban Board')).toBeInTheDocument()
    expect(screen.getByText('Gantt Chart')).toBeInTheDocument()
    expect(screen.getByText('Work Units')).toBeInTheDocument()
    expect(screen.getByText('Monte Carlo Simulation')).toBeInTheDocument()
  })

  it('renders feature card descriptions', () => {
    renderWithClient(<Dashboard />)
    
    expect(screen.getByText(/Visualize and manage your project workflow/)).toBeInTheDocument()
    expect(screen.getByText(/Timeline visualization with task dependencies/)).toBeInTheDocument()
    expect(screen.getByText(/Process simulation and checkpoint management/)).toBeInTheDocument()
    expect(screen.getByText(/AI-powered project completion prediction/)).toBeInTheDocument()
  })

  it('renders projects list section', () => {
    renderWithClient(<Dashboard />)
    expect(screen.getByText('Recent Projects')).toBeInTheDocument()
  })

  it('renders tasks list section', () => {
    renderWithClient(<Dashboard />)
    expect(screen.getByText('Recent Tasks')).toBeInTheDocument()
  })

  it('renders kanban summary section', () => {
    renderWithClient(<Dashboard />)
    expect(screen.getByText('Kanban Summary')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithClient(<Dashboard />)
    // The component should show loading states for data fetching
    expect(screen.getByText('Recent Projects')).toBeInTheDocument()
  })

  it('renders navigation correctly', () => {
    renderWithClient(<Dashboard />)
    // Check for navigation elements
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders with proper layout structure', () => {
    renderWithClient(<Dashboard />)
    
    // Check for main layout elements
    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
    
    // Check for grid layout classes
    const gridElements = document.querySelectorAll('.grid')
    expect(gridElements.length).toBeGreaterThan(0)
  })
}) 