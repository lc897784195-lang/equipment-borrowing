const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, equipmentId, date } = req.query;

    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    if (status) query.status = status;
    if (equipmentId) query.equipmentId = equipmentId;
    if (date) query.date = date;

    const bookings = await Booking.find(query, { orderBy: { field: 'createdAt', order: 'desc' } });

    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const user = await require('../models/User').findById(booking.userId);
      const equipment = await Equipment.findById(booking.equipmentId);
      return {
        ...booking,
        userId: user ? { _id: user._id, name: user.name, username: user.username } : null,
        equipmentId: equipment ? { _id: equipment._id, name: equipment.name, model: equipment.model } : null
      };
    }));

    res.json(populatedBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/available-slots/:equipmentId/:date', auth, async (req, res) => {
  try {
    const { equipmentId, date } = req.params;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.status === 'maintenance') {
      return res.status(400).json({ error: '设备不可用' });
    }

    const bookings = await Booking.findByEquipmentAndDate(equipmentId, date);

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
      for (let i = startIdx; i < endIdx; i++) {
        bookedSlots.add(allSlots[i]);
      }
    });

    const slots = allSlots.map(time => ({
      time,
      status: bookedSlots.has(time) ? 'booked' : 'available'
    }));

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { equipmentId, date, startTime, endTime } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.status === 'maintenance') {
      return res.status(400).json({ error: '设备不可用' });
    }

    const conflicting = await Booking.findConflicting(equipmentId, date, startTime, endTime);
    if (conflicting) {
      return res.status(400).json({ error: '该时间段已被预约' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      equipmentId,
      date,
      startTime,
      endTime
    });

    const user = await require('../models/User').findById(req.user._id);
    res.status(201).json({
      ...booking,
      userId: { _id: user._id, name: user.name, username: user.username },
      equipmentId: { _id: equipment._id, name: equipment.name, model: equipment.model }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: '预约未找到' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: '预约状态不是待审核' });
    }

    const updated = await Booking.updateById(req.params.id, {
      status: 'approved',
      adminNote: req.body.note || ''
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: '预约未找到' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: '预约状态不是待审核' });
    }

    const updated = await Booking.updateById(req.params.id, {
      status: 'rejected',
      adminNote: req.body.note || ''
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/return', auth, upload.single('image'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: '预约未找到' });
    }
    if (booking.userId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权操作' });
    }
    if (booking.status !== 'approved') {
      return res.status(400).json({ error: '预约状态不是已批准' });
    }

    const updateData = { status: 'returned' };
    if (req.file) {
      updateData.returnImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const updated = await Booking.updateById(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
