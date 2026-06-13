const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  model: { type: String, required: true },
  category: { type: String, required: true, enum: ['相机套机', '镜头', '灯光', '三脚架', '云台', '其他'] },
  description: { type: String, default: '' },
  status: { type: String, enum: ['available', 'maintenance'], default: 'available' },
  imageUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
