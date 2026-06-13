const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') filter.userId = req.user._id;
    const { status, equipmentId, date } = req.query;
    if (status) filter.status = status;
    if (equipmentId) filter.equipmentId = equipmentId;
    if (date) filter.date = new Date(date);
    const bookings = await Booking.find(filter)
      .populate('userId', 'name username')
      .populate('equipmentId', 'name model')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/available-slots/:equipmentId/:date', auth, async (req, res) => {
  try {
    const { equipmentId, date } = req.params;
    const targetDate = new Date(date);
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.status === 'maintenance') return res.status(400).json({ error: 'Equipment not available' });
    const bookings = await Booking.find({ equipmentId, date: targetDate, status: { $in: ['pending', 'approved'] } });
    const allSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }
    const bookedSlots = new Set();
    bookings.forEach(booking => {
      const startIdx = allSlots.indexOf(booking.startTime);
      const endIdx = allSlots.indexOf(booking.endTime);
      for (let i = startIdx; i < endIdx; i++) bookedSlots.add(allSlots[i]);
    });
    res.json(allSlots.map(time => ({ time, status: bookedSlots.has(time) ? 'booked' : 'available' })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { equipmentId, date, startTime, endTime } = req.body;
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.status === 'maintenance') return res.status(400).json({ error: 'Equipment not available' });
    const conflictingBooking = await Booking.findOne({
      equipmentId, date: new Date(date), status: { $in: ['pending', 'approved'] },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }]
    });
    if (conflictingBooking) return res.status(400).json({ error: 'Time slot already booked' });
    const booking = new Booking({ userId: req.user._id, equipmentId, date: new Date(date), startTime, endTime });
    await booking.save();
    await booking.populate(['userId', 'equipmentId']);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking is not pending' });
    booking.status = 'approved';
    booking.adminNote = req.body.note || '';
    await booking.save();
    await booking.populate(['userId', 'equipmentId']);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking is not pending' });
    booking.status = 'rejected';
    booking.adminNote = req.body.note || '';
    await booking.save();
    await booking.populate(['userId', 'equipmentId']);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/return', auth, upload.single('image'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    if (booking.status !== 'approved') return res.status(400).json({ error: 'Booking is not approved' });
    booking.status = 'returned';
    if (req.file) booking.returnImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    await booking.save();
    await booking.populate(['userId', 'equipmentId']);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
