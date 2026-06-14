const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalEquipment = await Equipment.count();
    const availableEquipment = await Equipment.count({ status: 'available' });
    const pendingBookings = await Booking.count({ status: 'pending' });
    const activeBookings = await Booking.count({ status: 'approved' });
    const totalUsers = await User.count({ role: 'user' });

    const recentBookings = await Booking.find({}, { orderBy: { field: 'createdAt', order: 'desc' }, limit: 5 });

    const populatedBookings = await Promise.all(recentBookings.map(async (booking) => {
      const user = await User.findById(booking.userId);
      const equipment = await Equipment.findById(booking.equipmentId);
      return {
        ...booking,
        userId: user ? { _id: user._id, name: user.name } : null,
        equipmentId: equipment ? { _id: equipment._id, name: equipment.name } : null
      };
    }));

    res.json({
      totalEquipment,
      availableEquipment,
      pendingBookings,
      activeBookings,
      totalUsers,
      recentBookings: populatedBookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-stats', auth, async (req, res) => {
  try {
    const myBookings = await Booking.count({ userId: req.user._id });
    const myPendingBookings = await Booking.count({ userId: req.user._id, status: 'pending' });
    const myActiveBookings = await Booking.count({ userId: req.user._id, status: 'approved' });

    const recentBookings = await Booking.find(
      { userId: req.user._id },
      { orderBy: { field: 'createdAt', order: 'desc' }, limit: 5 }
    );

    const populatedBookings = await Promise.all(recentBookings.map(async (booking) => {
      const equipment = await Equipment.findById(booking.equipmentId);
      return {
        ...booking,
        equipmentId: equipment ? { _id: equipment._id, name: equipment.name, model: equipment.model } : null
      };
    }));

    res.json({
      myBookings,
      myPendingBookings,
      myActiveBookings,
      recentBookings: populatedBookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
