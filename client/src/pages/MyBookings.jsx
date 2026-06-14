import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BookingStatusBadge from '../components/BookingStatusBadge';
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/bookings').then(res => setBookings(res.data)).finally(() => setLoading(false)); }, []);
  const handleReturn = async (bookingId) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData(); formData.append('image', file);
      try {
        await api.put(`/bookings/${bookingId}/return`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        api.get('/bookings').then(res => setBookings(res.data));
        alert('归还成功');
      } catch (error) { alert(error.response?.data?.error || '归还失败'); }
    };
    input.click();
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
                <p className="text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()} {booking.startTime} - {booking.endTime}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            {booking.adminNote && <p className="text-sm text-gray-500 mt-2">管理员备注：{booking.adminNote}</p>}
            {booking.status === 'approved' && <button onClick={() => handleReturn(booking._id)} className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">归还设备</button>}
            {booking.returnImageUrl && <div className="mt-2"><p className="text-sm text-gray-500">归还凭证：</p><img src={booking.returnImageUrl} alt="Return" className="w-32 h-32 object-cover rounded mt-1" /></div>}
          </div>
        ))}
      </div>
      {bookings.length === 0 && <p className="text-center text-gray-500">暂无预约记录</p>}
    </div>
  );
};
export default MyBookings;