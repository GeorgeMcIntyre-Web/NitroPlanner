import React from 'react';
import { useRouter } from 'next/router';
import EquipmentDetail from '../../components/equipment-digital-twin/EquipmentDetail';

const EquipmentDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!id || typeof id !== 'string') return null;
  return (
    <div className="p-6">
      <EquipmentDetail equipmentId={id} />
    </div>
  );
};

export default EquipmentDetailPage; 