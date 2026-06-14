import React from 'react';
import { useNavigate } from 'react-router-dom';
const EquipmentCard = ({ equipment }) => {
  const navigate = useNavigate();
  const statusColors = { available: 'bg-green-100 text-green-800', maintenance: 'bg-red-100 text-red-800' };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {equipment.imageUrl && <img src={equipment.imageUrl} alt={equipment.name} className="w-full h-48 object-cover" />}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{equipment.name}</h3>
        <p className="text-gray-600">{equipment.model}</p>
        <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mt-2">{equipment.category}</span>
        <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 mt-2 ${statusColors[equipment.status]}`}>{equipment.status === 'available' ? '可用' : '维护中'}</span>
        {equipment.status === 'available' && <button onClick={() => navigate(`/equipment/${equipment._id}/booking`)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">预约借用</button>}
      </div>
    </div>
  );
};
export default EquipmentCard;