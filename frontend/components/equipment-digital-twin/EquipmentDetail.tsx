import React, { useEffect, useState } from 'react';
import { getEquipment, deleteEquipment } from '../../utils/api';
import { useRouter } from 'next/router';

interface EquipmentDetailProps {
  equipmentId: string;
}

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ equipmentId }) => {
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getEquipment(equipmentId).then(data => {
      setEquipment(data);
      setLoading(false);
    });
  }, [equipmentId]);

  const handleDelete = async () => {
    if (confirm('Delete this equipment?')) {
      await deleteEquipment(equipmentId);
      router.push('/equipment');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!equipment) return <div>Not found</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{equipment.name}</h2>
      <div className="mb-2">Type: {equipment.equipmentType}</div>
      <div className="mb-2">Status: {equipment.status}</div>
      <div className="mb-2">Model: {equipment.model}</div>
      <div className="mb-2">Manufacturer: {equipment.manufacturer}</div>
      <div className="mb-2">Serial: {equipment.serialNumber}</div>
      <div className="mb-2">Location: {equipment.location}</div>
      <div className="mb-2">Department: {equipment.department}</div>
      <div className="mb-2">Lifecycle: {equipment.lifecycleStage}</div>
      <div className="mb-2">Purchase Date: {equipment.purchaseDate}</div>
      <div className="mb-2">Warranty Expiry: {equipment.warrantyExpiry}</div>
      <div className="mb-2">Created: {equipment.createdAt}</div>
      <div className="mb-2">Updated: {equipment.updatedAt}</div>
      <h3 className="font-semibold mt-4">Metrics</h3>
      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(equipment.equipmentMetrics, null, 2)}</pre>
      <h3 className="font-semibold mt-4">Status</h3>
      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(equipment.equipmentStatus, null, 2)}</pre>
      <h3 className="font-semibold mt-4">Capacity</h3>
      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(equipment.equipmentCapacity, null, 2)}</pre>
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={() => router.push(`/equipment/${equipmentId}/edit`)}>Edit</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
};

export default EquipmentDetail; 