import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export const connectSocket = () => {
  socket = io(SOCKET_URL);
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinEquipmentRoom = (equipmentId) => {
  if (socket) socket.emit('join-equipment', equipmentId);
};

export const leaveEquipmentRoom = (equipmentId) => {
  if (socket) socket.emit('leave-equipment', equipmentId);
};
