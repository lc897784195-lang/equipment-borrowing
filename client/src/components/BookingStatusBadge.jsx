import React from 'react';
const statusConfig = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  returned: { label: '已归还', color: 'bg-gray-100 text-gray-800' }
};
const BookingStatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>{config.label}</span>;
};
export default BookingStatusBadge;