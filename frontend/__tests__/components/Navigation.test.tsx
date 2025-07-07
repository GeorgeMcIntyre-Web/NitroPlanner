import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '../../components/Navigation'

describe('Navigation Component', () => {
  const mockProps = {
    currentPage: 'dashboard',
    onPageChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation component', () => {
    render(<Navigation {...mockProps} />)
    
    expect(screen.getByText('NitroPlanner')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Kanban')).toBeInTheDocument()
    expect(screen.getByText('Gantt')).toBeInTheDocument()
    expect(screen.getByText('Work Units')).toBeInTheDocument()
    expect(screen.getByText('Simulation')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    render(<Navigation {...mockProps} />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-gray-900', 'text-white')
  })

  it('calls onPageChange when navigation item is clicked', () => {
    render(<Navigation {...mockProps} />)
    
    const kanbanLink = screen.getByText('Kanban')
    fireEvent.click(kanbanLink)
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith('kanban')
  })

  it('renders all navigation items', () => {
    render(<Navigation {...mockProps} />)
    
    const expectedItems = [
      'Dashboard',
      'Kanban', 
      'Gantt',
      'Work Units',
      'Simulation',
      'Analytics',
      'Settings'
    ]
    
    expectedItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  it('applies correct styling to navigation items', () => {
    render(<Navigation {...mockProps} />)
    
    const navigationItems = screen.getAllByRole('link')
    navigationItems.forEach(item => {
      expect(item).toHaveClass('text-gray-300', 'hover:bg-gray-700', 'hover:text-white')
    })
  })

  it('handles different current pages', () => {
    const { rerender } = render(<Navigation {...mockProps} />)
    
    // Test with kanban as current page
    rerender(<Navigation currentPage="kanban" onPageChange={mockProps.onPageChange} />)
    const kanbanLink = screen.getByText('Kanban').closest('a')
    expect(kanbanLink).toHaveClass('bg-gray-900', 'text-white')
    
    // Test with gantt as current page
    rerender(<Navigation currentPage="gantt" onPageChange={mockProps.onPageChange} />)
    const ganttLink = screen.getByText('Gantt').closest('a')
    expect(ganttLink).toHaveClass('bg-gray-900', 'text-white')
  })
}) 