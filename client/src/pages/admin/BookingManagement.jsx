import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BookingStatusBadge from '../../components/BookingStatusBadge';
const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/bookings', { params: filter !== 'all' ? { status: filter } : {} }).then(res => setBookings(res.data)).finally(() => setLoading(false)); }, [filter]);
  const handleApprove = async (id) => { try { await api.put(`/bookings/${id}/approve`); api.get('/bookings').then(res => setBookings(res.data)); } catch (error) { alert(error.response?.data?.error || '操作失败'); } };
  const handleReject = async (id) => { const note = prompt('请输入拒绝原因（可选）'); try { await api.put(`/bookings/${id}/reject`, { note }); api.get('/bookings').then(res => setBookings(res.data)); } catch (error) { alert(error.response?.data?.error || '操作失败'); } };
  if (loading) return <div>加载中...</div>;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">预约管理</h1>
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'approved', 'rejected', 'returned'].map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded ${filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            {status === 'all' ? '全部' : status === 'pending' ? '待审核' : status === 'approved' ? '已批准' : status === 'rejected' ? '已拒绝' : '已归还'}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{booking.equipmentId?.name}</h3>
                <p className="text-gray-600">借用人：{booking.userId?.name}</p>
                <p className="text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()} {booking.startTime} - {booking.endTime}</p>
                {booking.adminNote && <p className="text-sm text-gray-500 mt-1">备注：{booking.adminNote}</p>}
                {booking.returnImageUrl && <div className="mt-2"><p className="text-sm text-gray-500">归还凭证：</p><img src={booking.returnImageUrl} alt="Return" className="w-32 h-32 object-cover rounded mt-1" /></div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <BookingStatusBadge status={booking.status} />
                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(booking._id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">批准</button>
                    <button onClick={() => handleReject(booking._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">拒绝</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {bookings.length === 0 && <p className="text-center text-gray-500">暂无预约记录</p>}
    </div>
  );
};
export default BookingManagement;
