import React, { useState, useEffect } from 'react';
import api from '../../services/api';
const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', model: '', category: '相机套机', description: '', status: 'available' });
  const categories = ['相机套机', '镜头', '灯光', '三脚架', '云台', '其他'];
  useEffect(() => { api.get('/equipment').then(res => setEquipment(res.data)); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/equipment/${editingId}`, formData);
      else await api.post('/equipment', formData);
      api.get('/equipment').then(res => setEquipment(res.data));
      resetForm();
    } catch (error) { alert(error.response?.data?.error || '操作失败'); }
  };
  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({ name: item.name, model: item.model, category: item.category, description: item.description, status: item.status });
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('确定删除此设备？')) return;
    try { await api.delete(`/equipment/${id}`); api.get('/equipment').then(res => setEquipment(res.data)); }
    catch (error) { alert(error.response?.data?.error || '删除失败'); }
  };
  const resetForm = () => { setFormData({ name: '', model: '', category: '相机套机', description: '', status: 'available' }); setEditingId(null); setShowForm(false); };
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">设备管理</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">新增设备</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? '编辑设备' : '新增设备'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-2">设备名称</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-gray-700 mb-2">型号</label><input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-gray-700 mb-2">分类</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div><label className="block text-gray-700 mb-2">状态</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="available">可用</option><option value="maintenance">维护中</option></select></div>
              <div className="md:col-span-2"><label className="block text-gray-700 mb-2">描述</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="3" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">{editingId ? '更新' : '创建'}</button>
              <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">取消</button>
            </div>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-gray-600">{item.model}</p>
            <p className="text-sm text-gray-500">{item.category}</p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status === 'available' ? '可用' : '维护中'}</span>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleEdit(item)} className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">编辑</button>
              <button onClick={() => handleDelete(item._id)} className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600">删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default EquipmentManagement;
