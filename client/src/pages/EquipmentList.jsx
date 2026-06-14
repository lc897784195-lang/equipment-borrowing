import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EquipmentCard from '../components/EquipmentCard';
const EquipmentList = () => {
  const [equipment, setEquipment] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const categories = ['', '相机套机', '镜头', '灯光', '三脚架', '云台', '其他'];
  useEffect(() => { fetchEquipment(); }, [category]);
  const fetchEquipment = async () => {
    try {
      const params = category ? { category } : {};
      const res = await api.get('/equipment', { params });
      setEquipment(res.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };
  if (loading) return <div>加载中...</div>;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">设备列表</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded ${category === cat ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{cat || '全部'}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item) => <EquipmentCard key={item._id} equipment={item} />)}
      </div>
      {equipment.length === 0 && <p className="text-center text-gray-500">暂无设备</p>}
    </div>
  );
};
export default EquipmentList;