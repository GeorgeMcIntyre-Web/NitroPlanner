import React, { useState } from 'react';
import { createEquipment, updateEquipment } from '../../utils/api';
import { useRouter } from 'next/router';

interface EquipmentFormProps {
  equipment?: any;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ equipment }) => {
  const [form, setForm] = useState<any>(equipment || {
    name: '',
    equipmentType: '',
    status: 'active',
    model: '',
    manufacturer: '',
    serialNumber: '',
    location: '',
    department: '',
    lifecycleStage: 'operational',
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (equipment) {
      await updateEquipment(equipment.id, form);
      router.push(`/equipment/${equipment.id}`);
    } else {
      await createEquipment(form);
      router.push('/equipment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">{equipment ? 'Edit Equipment' : 'Add Equipment'}</h2>
      <div className="mb-2">
        <label className="block">Name</label>
        <input name="name" value={form.name} onChange={handleChange} className="border px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block">Type</label>
        <input name="equipmentType" value={form.equipmentType} onChange={handleChange} className="border px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className="border px-2 py-1 w-full">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block">Model</label>
        <input name="model" value={form.model} onChange={handleChange} className="border px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block">Manufacturer</label>
        <input name="manufacturer" value={form.manufacturer} onChange={handleChange} className="border px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block">Serial Number</label>
        <input name="serialNumber" value={form.serialNumber} onChange={handleChange} className="border px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block">Location</label>
        <input name="location" value={form.location} onChange={handleChange} className="border px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block">Department</label>
        <input name="department" value={form.department} onChange={handleChange} className="border px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block">Lifecycle Stage</label>
        <select name="lifecycleStage" value={form.lifecycleStage} onChange={handleChange} className="border px-2 py-1 w-full">
          <option value="operational">Operational</option>
          <option value="new">New</option>
          <option value="maintenance">Maintenance</option>
          <option value="end_of_life">End of Life</option>
        </select>
      </div>
      <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>
        {saving ? 'Saving...' : (equipment ? 'Update' : 'Create')}
      </button>
    </form>
  );
};

export default EquipmentForm; 