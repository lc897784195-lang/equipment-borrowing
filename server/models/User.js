const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async create(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    data.role = data.role || 'user';
    data.createdAt = new Date();
    return super.create(data);
  }

  async findByUsername(username) {
    return this.findOne({ username });
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = new User();
