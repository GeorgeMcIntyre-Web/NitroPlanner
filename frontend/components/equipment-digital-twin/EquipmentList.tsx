import React, { useEffect, useState } from 'react';
import { getEquipmentList } from '../../utils/api';
import Link from 'next/link';

const EquipmentList: React.FC = () => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEquipmentList().then(data => {
      setEquipment(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading equipment...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Equipment List</h2>
      <Link href="/equipment/new">
        <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">Add Equipment</button>
      </Link>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(eq => (
            <tr key={eq.id}>
              <td className="border px-2 py-1">{eq.name}</td>
              <td className="border px-2 py-1">{eq.equipmentType}</td>
              <td className="border px-2 py-1">{eq.status}</td>
              <td className="border px-2 py-1">
                <Link href={`/equipment/${eq.id}`} className="text-blue-600 underline">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentList; 