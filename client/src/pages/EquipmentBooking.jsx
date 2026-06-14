import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import api from '../services/api';
import TimeSlotPicker from '../components/TimeSlotPicker';
const EquipmentBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get(`/equipment/${id}`).then(res => setEquipment(res.data)); }, [id]);
  useEffect(() => { api.get(`/bookings/available-slots/${id}/${selectedDate}`).then(res => setSlots(res.data)).finally(() => setLoading(false)); }, [id, selectedDate]);
  const handleSelect = (start, end) => setSelectedRange({ start, end });
  const handleSubmit = async () => {
    if (!selectedRange) return;
    try {
      await api.post('/bookings', { equipmentId: id, date: selectedDate, startTime: selectedRange.start, endTime: selectedRange.end });
      alert('预约已提交，等待管理员审核');
      navigate('/bookings');
    } catch (error) { alert(error.response?.data?.error || '预约失败'); }
  };
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'));
  if (loading) return <div>加载中...</div>;
  if (!equipment) return <div>设备未找到</div>;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{equipment.name} - 预约借用</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">选择日期</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => <button key={date} onClick={() => setSelectedDate(date)} className={`px-4 py-2 rounded whitespace-nowrap ${selectedDate === date ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{date}</button>)}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">选择时间段</h2>
        <p className="text-sm text-gray-500 mb-4">点击开始时间，再点击结束时间</p>
        <TimeSlotPicker slots={slots} onSelect={handleSelect} selectedRange={selectedRange} />
        <div className="flex gap-4 mt-4">
          <div className="flex items-center"><div className="w-4 h-4 bg-green-100 rounded mr-2"></div><span className="text-sm">空闲</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-red-200 rounded mr-2"></div><span className="text-sm">已预约</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded mr-2"></div><span className="text-sm">已选择</span></div>
        </div>
      </div>
      {selectedRange && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">确认预约</h2>
          <p>日期：{selectedDate}</p>
          <p>时间：{selectedRange.start} - {selectedRange.end}</p>
          <button onClick={handleSubmit} className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">提交预约</button>
        </div>
      )}
    </div>
  );
};
export default EquipmentBooking;