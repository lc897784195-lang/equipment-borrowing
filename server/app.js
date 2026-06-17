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

app.get('/', (req, res) => res.send('Equipment Borrowing API'));

app.use('/auth', require('./routes/auth'));
app.use('/equipment', require('./routes/equipment'));
app.use('/bookings', require('./routes/bookings'));
app.use('/dashboard', require('./routes/dashboard'));

module.exports = app;
