import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import axios from 'axios';

interface WorkUnit {
  id: string;
  name: string;
  status: string;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  startDate: string;
  endDate: string;
  dependencies: string[];
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface DependencyGraph {
  nodes: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    estimatedHours: number;
    actualHours: number;
    startDate: string;
    endDate: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

interface CriticalPath {
  path: Array<{
    id: string;
    name: string;
    duration: number;
    earliestStart: number;
    latestStart: number;
  }>;
  totalDuration: number;
  criticalNodes: string[];
}

interface WorkflowMetrics {
  totalWorkUnits: number;
  completedWorkUnits: number;
  inProgressWorkUnits: number;
  pendingWorkUnits: number;
  completionRate: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  efficiency: number;
  avgProgress: number;
  dependencyCount: number;
  avgDependenciesPerWorkUnit: number;
}

const WorkflowVisualizer: React.FC = () => {
  const router = useRouter();
  const { projectId } = router.query;
  
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraph | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPath | null>(null);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkUnit, setSelectedWorkUnit] = useState<string | null>(null);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [editingDependencies, setEditingDependencies] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) {
      loadWorkflow();
    }
  }, [projectId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/workflow-engine/project/${projectId}`);
      setWorkUnits(response.data.workUnits);
      setDependencyGraph(response.data.dependencyGraph);
      setCriticalPath(response.data.criticalPath);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkUnitClick = (workUnitId: string) => {
    setSelectedWorkUnit(selectedWorkUnit === workUnitId ? null : workUnitId);
  };

  const handleEditDependencies = (workUnitId: string) => {
    const workUnit = workUnits.find(wu => wu.id === workUnitId);
    if (workUnit) {
      setEditingDependencies(workUnit.dependencies || []);
      setSelectedWorkUnit(workUnitId);
      setShowDependencyModal(true);
    }
  };

  const handleSaveDependencies = async () => {
    if (!selectedWorkUnit) return;

    try {
      await axios.put(`/api/workflow-engine/dependencies/${selectedWorkUnit}`, {
        dependencies: editingDependencies
      });
      
      setShowDependencyModal(false);
      setSelectedWorkUnit(null);
      setEditingDependencies([]);
      
      // Reload workflow to reflect changes
      await loadWorkflow();
    } catch (error) {
      console.error('Error updating dependencies:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workflow...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workflow Visualizer</h1>
          <p className="text-gray-600 mt-2">Visualize and manage process dependencies</p>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalWorkUnits}</div>
                <div className="text-sm text-gray-600">Total Work Units</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.avgProgress.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Average Progress</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.dependencyCount}</div>
                <div className="text-sm text-gray-600">Dependencies</div>
              </div>
            </Card>
          </div>
        )}

        {/* Critical Path */}
        {criticalPath && (
          <Card title="Critical Path" className="mb-8">
            <div className="mb-4">
              <div className="text-sm text-gray-600">
                Total Duration: <span className="font-semibold">{criticalPath.totalDuration} hours</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalPath.path.map((node, index) => (
                <div key={node.id} className="flex items-center">
                  <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-2 text-sm">
                    <div className="font-medium text-red-800">{node.name}</div>
                    <div className="text-red-600">{node.duration}h</div>
                  </div>
                  {index < criticalPath.path.length - 1 && (
                    <div className="mx-2 text-gray-400">→</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Work Units Grid */}
        <Card title="Work Units">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workUnits.map((workUnit) => (
              <div
                key={workUnit.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedWorkUnit === workUnit.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleWorkUnitClick(workUnit.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 truncate">{workUnit.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(workUnit.status)}`}></div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{workUnit.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(workUnit.progress)}`}
                      style={{ width: `${workUnit.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated:</span>
                    <span className="font-medium">{workUnit.estimatedHours}h</span>
                  </div>

                  {workUnit.actualHours > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Actual:</span>
                      <span className="font-medium">{workUnit.actualHours}h</span>
                    </div>
                  )}

                  {workUnit.assignedTo && (
                    <div className="text-sm text-gray-600">
                      Assigned to: {workUnit.assignedTo.firstName} {workUnit.assignedTo.lastName}
                    </div>
                  )}

                  {workUnit.dependencies && workUnit.dependencies.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Dependencies: {workUnit.dependencies.length}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDependencies(workUnit.id);
                    }}
                  >
                    Edit Dependencies
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Dependency Modal */}
        {showDependencyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Dependencies</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dependencies
                </label>
                <div className="space-y-2">
                  {workUnits.map((workUnit) => (
                    <label key={workUnit.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingDependencies.includes(workUnit.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingDependencies([...editingDependencies, workUnit.id]);
                          } else {
                            setEditingDependencies(editingDependencies.filter(id => id !== workUnit.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{workUnit.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDependencyModal(false);
                    setSelectedWorkUnit(null);
                    setEditingDependencies([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveDependencies}>
                  Save Dependencies
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowVisualizer; 