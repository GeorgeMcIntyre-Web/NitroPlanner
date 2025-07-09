import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface WorkProps {
  currentWork: {
    workUnits: any[];
    tasks: any[];
  };
  onNavigateToWorkUnits: () => void;
}

const DigitalTwinWork: React.FC<WorkProps> = ({ currentWork, onNavigateToWorkUnits }) => {
  return (
    <Card className="p-8 bg-white shadow-lg border-0">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Current Work</h2>
      </div>
      <div className="space-y-4">
        {currentWork.workUnits.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Work Units ({currentWork.workUnits.length})</h3>
            <div className="space-y-2">
              {currentWork.workUnits.map((workUnit, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                  <div>
                    <div className="font-semibold text-blue-900">{workUnit.name}</div>
                    <div className="text-sm text-blue-700">
                      {workUnit.project?.name || 'No project'}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    workUnit.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                    workUnit.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {workUnit.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentWork.tasks.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Tasks ({currentWork.tasks.length})</h3>
            <div className="space-y-2">
              {currentWork.tasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                  <div>
                    <div className="font-semibold text-green-900">{task.title}</div>
                    <div className="text-sm text-green-700">
                      {task.project?.name || 'No project'}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    task.status === 'in_progress' ? 'bg-green-200 text-green-800' :
                    task.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentWork.workUnits.length === 0 && currentWork.tasks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No current work assignments</p>
            <Button variant="secondary" onClick={onNavigateToWorkUnits}>
              Browse Work Units
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default React.memo(DigitalTwinWork); 