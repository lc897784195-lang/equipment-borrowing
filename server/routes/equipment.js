const express = require('express');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let equipment;
    if (category) {
      equipment = await Equipment.findByCategory(category);
    } else {
      equipment = await Equipment.find({}, { orderBy: { field: 'createdAt', order: 'desc' } });
    }
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: '设备未找到' });
    }
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, model, category, description } = req.body;
    const equipment = await Equipment.create({
      name,
      model,
      category,
      description,
      imageUrl: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : ''
    });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, model, category, description, status } = req.body;
    const updateData = { name, model, category, description, status };

    if (req.file) {
      updateData.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const equipment = await Equipment.updateById(req.params.id, updateData);
    if (!equipment) {
      return res.status(404).json({ error: '设备未找到' });
    }

    res.json(equipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: '设备未找到' });
    }
    await Equipment.deleteById(req.params.id);
    res.json({ message: '设备已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
