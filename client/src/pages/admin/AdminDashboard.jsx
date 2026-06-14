import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/dashboard/stats').then(res => setStats(res.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <div>加载中...</div>;
  if (!stats) return <div>加载失败</div>;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理员仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4"><h3 className="text-gray-500 text-sm">设备总数</h3><p className="text-3xl font-bold">{stats.totalEquipment}</p></div>
        <div className="bg-white rounded-lg shadow-md p-4"><h3 className="text-gray-500 text-sm">可用设备</h3><p className="text-3xl font-bold text-green-600">{stats.availableEquipment}</p></div>
        <div className="bg-white rounded-lg shadow-md p-4"><h3 className="text-gray-500 text-sm">待审核预约</h3><p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p></div>
        <div className="bg-white rounded-lg shadow-md p-4"><h3 className="text-gray-500 text-sm">用户数量</h3><p className="text-3xl font-bold">{stats.totalUsers}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/equipment" className="bg-blue-500 text-white rounded-lg p-4 text-center hover:bg-blue-600">设备管理</Link>
        <Link to="/admin/bookings" className="bg-green-500 text-white rounded-lg p-4 text-center hover:bg-green-600">预约管理</Link>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">最近预约</h2>
        <div className="space-y-2">
          {stats.recentBookings.map((booking) => (
            <div key={booking._id} className="flex justify-between items-center p-2 border-b">
              <div><span className="font-medium">{booking.userId?.name}</span><span className="text-gray-500"> 预约了 </span><span className="font-medium">{booking.equipmentId?.name}</span></div>
              <span className="text-sm text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
