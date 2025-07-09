import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import EquipmentForm from '../../../components/equipment-digital-twin/EquipmentForm';
import { getEquipment } from '../../../utils/api';

const EditEquipmentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [equipment, setEquipment] = useState<any>(null);
  useEffect(() => {
    if (id && typeof id === 'string') {
      getEquipment(id).then(setEquipment);
    }
  }, [id]);
  if (!id || typeof id !== 'string') return null;
  if (!equipment) return <div>Loading...</div>;
  return (
    <div className="p-6">
      <EquipmentForm equipment={equipment} />
    </div>
  );
};

export default EditEquipmentPage; 