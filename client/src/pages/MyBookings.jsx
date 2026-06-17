import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BookingStatusBadge from '../components/BookingStatusBadge';
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/bookings').then(res => setBookings(res.data)).finally(() => setLoading(false)); }, []);
  const handleReturn = async (bookingId) => {
    if (!window.confirm('确认归还此设备？')) return;
    try {
      await api.put(`/bookings/${bookingId}/return`, {});
      api.get('/bookings').then(res => setBookings(res.data));
      alert('归还成功');
    } catch (error) { alert(error.response?.data?.error || '归还失败'); }
  };
  if (loading) return <div>加载中...</div>;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">我的预约</h1>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{booking.equipmentId?.name}</h3>
                <p className="text-gray-600">{booking.equipmentId?.model}</p>
                <p className="text-sm text-gray-500">{booking.date} {booking.startTime} - {booking.endTime}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            {booking.adminNote && <p className="text-sm text-gray-500 mt-2">管理员备注：{booking.adminNote}</p>}
            {booking.status === 'approved' && <button onClick={() => handleReturn(booking._id)} className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">归还设备</button>}
          </div>
        ))}
      </div>
      {bookings.length === 0 && <p className="text-center text-gray-500">暂无预约记录</p>}
    </div>
  );
};
export default MyBookings;
