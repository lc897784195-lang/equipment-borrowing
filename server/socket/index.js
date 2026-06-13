const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-equipment', (equipmentId) => socket.join(`equipment-${equipmentId}`));
    socket.on('leave-equipment', (equipmentId) => socket.leave(`equipment-${equipmentId}`));
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });
  return io;
};

const emitBookingUpdate = (io, equipmentId, booking) => {
  io.to(`equipment-${equipmentId}`).emit('booking-updated', booking);
};

module.exports = { setupSocket, emitBookingUpdate };
