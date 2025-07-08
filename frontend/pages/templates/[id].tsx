import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import axios from 'axios';

interface Step {
  id: number;
  stepName: string;
  sequenceOrder: number;
  baselineTimeHours: number;
  assignmentType: string;
  assignedRoleId?: number;
  assignedMachineId?: number;
  dependencyStepId?: number;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  steps: Step[];
}

const TemplateEditor: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/templates/${id}`).then(res => {
      setTemplate(res.data);
      setEditName(res.data.name);
      setEditDescription(res.data.description || '');
      setLoading(false);
    });
  }, [id]);

  const handleSave = () => {
    // TODO: Save template name/description changes
  };

  const handleAddStep = () => {
    // TODO: Open modal to add a new step
  };

  // Placeholder for drag-and-drop steps table
  const StepsTable = () => (
    <Card title="Process Steps" className="mt-6">
      <div className="mb-4">
        <Button onClick={handleAddStep}>+ Add Step</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Order</th>
              <th className="px-4 py-2 text-left">Step Name</th>
              <th className="px-4 py-2 text-left">Baseline Time (h)</th>
              <th className="px-4 py-2 text-left">Assignment</th>
              <th className="px-4 py-2 text-left">Dependencies</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {template?.steps?.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((step, idx) => (
              <tr key={step.id} className="border-b">
                <td className="px-4 py-2">{step.sequenceOrder}</td>
                <td className="px-4 py-2">{step.stepName}</td>
                <td className="px-4 py-2">{step.baselineTimeHours}</td>
                <td className="px-4 py-2">{step.assignmentType}</td>
                <td className="px-4 py-2">{step.dependencyStepId ?? '-'}</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="secondary" onClick={() => { /* TODO: Edit step */ }}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-400">Drag and drop to reorder steps (coming soon)</div>
    </Card>
  );

  if (loading) return <div className="text-center py-12 text-gray-500">Loading template...</div>;
  if (!template) return <div className="text-center py-12 text-red-500">Template not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
        <Button variant="primary" onClick={handleSave}>Save</Button>
      </div>
      <Card>
        <Input
          label="Template Name"
          value={editName}
          onChange={e => setEditName(e.target.value)}
        />
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </Card>
      <StepsTable />
    </div>
  );
};

export default TemplateEditor; 