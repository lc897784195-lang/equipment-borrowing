const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.get('/api', (req, res) => res.send('Equipment Borrowing API'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/dashboard', require('./routes/dashboard'));

module.exports = app;
