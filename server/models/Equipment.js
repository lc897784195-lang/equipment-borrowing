const BaseModel = require('./BaseModel');

class Equipment extends BaseModel {
  constructor() {
    super('equipment');
  }

  async create(data) {
    data.status = data.status || 'available';
    data.imageUrl = data.imageUrl || '';
    data.createdAt = new Date();
    return super.create(data);
  }

  async findByCategory(category) {
    return this.find({ category }, { orderBy: { field: 'createdAt', order: 'desc' } });
  }
}

module.exports = new Equipment();
