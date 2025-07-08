import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Template {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

const TemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios.get('/api/templates').then(res => {
      setTemplates(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Process Step Template Library</h1>
        <Button onClick={() => { /* TODO: open create modal */ }}>
          + New Template
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(t => (
            <Card key={t.id} title={t.name} className="flex flex-col justify-between h-full">
              <div className="mb-4 text-gray-700">{t.description || <span className="italic text-gray-400">No description</span>}</div>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => router.push(`/templates/${t.id}`)}>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary; 