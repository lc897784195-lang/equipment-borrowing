const BaseModel = require('./BaseModel');
const { _ } = require('../config/db');

class Booking extends BaseModel {
  constructor() {
    super('bookings');
  }

  async create(data) {
    data.status = data.status || 'pending';
    data.returnImageUrl = data.returnImageUrl || '';
    data.adminNote = data.adminNote || '';
    data.createdAt = new Date();
    return super.create(data);
  }

  async findByUser(userId) {
    return this.find({ userId }, { orderBy: { field: 'createdAt', order: 'desc' } });
  }

  async findByEquipmentAndDate(equipmentId, date) {
    return this.find({
      equipmentId,
      date,
      status: _.in(['pending', 'approved'])
    });
  }

  async findConflicting(equipmentId, date, startTime, endTime) {
    return this.findOne({
      equipmentId,
      date,
      status: _.in(['pending', 'approved']),
      startTime: _.lt(endTime),
      endTime: _.gt(startTime)
    });
  }
}

module.exports = new Booking();
