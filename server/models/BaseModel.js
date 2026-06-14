const { db, _ } = require('../config/db');

class BaseModel {
  constructor(collectionName) {
    this.collection = db.collection(collectionName);
  }

  async findById(id) {
    const res = await this.collection.doc(id).get();
    return res.data[0] || null;
  }

  async findOne(query) {
    const res = await this.collection.where(query).limit(1).get();
    return res.data[0] || null;
  }

  async find(query = {}, options = {}) {
    let ref = this.collection.where(query);
    if (options.orderBy) {
      ref = ref.orderBy(options.orderBy.field, options.orderBy.order || 'desc');
    }
    if (options.limit) {
      ref = ref.limit(options.limit);
    }
    if (options.skip) {
      ref = ref.skip(options.skip);
    }
    const res = await ref.get();
    return res.data;
  }

  async create(data) {
    const res = await this.collection.add(data);
    return { _id: res.id, ...data };
  }

  async updateById(id, data) {
    await this.collection.doc(id).update(data);
    return this.findById(id);
  }

  async deleteById(id) {
    return this.collection.doc(id).remove();
  }

  async count(query = {}) {
    const res = await this.collection.where(query).count();
    return res.total;
  }
}

module.exports = BaseModel;
