const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments();
    const availableEquipment = await Equipment.countDocuments({ status: 'available' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeBookings = await Booking.countDocuments({ status: 'approved' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const recentBookings = await Booking.find()
      .populate('userId', 'name')
      .populate('equipmentId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ totalEquipment, availableEquipment, pendingBookings, activeBookings, totalUsers, recentBookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-stats', auth, async (req, res) => {
  try {
    const myBookings = await Booking.countDocuments({ userId: req.user._id });
    const myPendingBookings = await Booking.countDocuments({ userId: req.user._id, status: 'pending' });
    const myActiveBookings = await Booking.countDocuments({ userId: req.user._id, status: 'approved' });
    const recentBookings = await Booking.find({ userId: req.user._id })
      .populate('equipmentId', 'name model')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ myBookings, myPendingBookings, myActiveBookings, recentBookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
