import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

interface TaskCreateFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  customFields?: React.ReactNode;
}

const defaultForm = {
  name: '',
  description: '',
  priority: 'medium',
  assignee: '',
  due_date: '',
  estimated_hours: '',
};

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TaskCreateForm: React.FC<TaskCreateFormProps> = ({ onSubmit, onCancel, loading, customFields }) => {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.name.trim()) errs.name = 'Task name is required.';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Task Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
        required
      />
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Input
          label="Assignee"
          name="assignee"
          value={form.assignee}
          onChange={handleChange}
          placeholder="Enter assignee name or email"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Due Date"
          name="due_date"
          type="date"
          value={form.due_date}
          onChange={handleChange}
        />
        <Input
          label="Estimated Hours"
          name="estimated_hours"
          type="number"
          min="0"
          value={form.estimated_hours}
          onChange={handleChange}
        />
      </div>
      {/* Custom fields placeholder */}
      {customFields}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Create Task
        </Button>
      </div>
    </form>
  );
};

export default TaskCreateForm; 