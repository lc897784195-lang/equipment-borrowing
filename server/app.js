const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', require('./routes/auth'));
app.use('/equipment', require('./routes/equipment'));
app.use('/bookings', require('./routes/bookings'));
app.use('/dashboard', require('./routes/dashboard'));

module.exports = app;
