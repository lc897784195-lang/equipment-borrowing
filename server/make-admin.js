require('dotenv').config();
const { db } = require('./config/db');

async function makeAdmin() {
  try {
    const res = await db.collection('users')
      .where({ username: 'testuser' })
      .update({ role: 'admin' });
    console.log('Done:', res);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

makeAdmin();
