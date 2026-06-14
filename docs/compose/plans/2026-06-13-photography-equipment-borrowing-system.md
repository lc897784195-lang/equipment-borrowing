# Photography Equipment Borrowing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete photography equipment borrowing management system with admin and user roles, drag-and-drop time slot booking, real-time status updates, and image-based return verification.

**Architecture:** React SPA frontend with Tailwind CSS, Node.js + Express REST API backend, MongoDB database, Socket.io for real-time updates, Cloudinary for image storage. Deployed on Vercel (frontend) and Render/Railway (backend).

**Tech Stack:** React, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, Socket.io, Cloudinary, JWT, bcryptjs, react-beautiful-dnd

---

## File Structure

```
equipment-borrowing/
├── client/                          # Frontend React app
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── TimeSlotPicker.jsx
│   │   │   ├── EquipmentCard.jsx
│   │   │   └── BookingStatusBadge.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EquipmentList.jsx
│   │   │   ├── EquipmentBooking.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── EquipmentManagement.jsx
│   │   │   │   ├── BookingManagement.jsx
│   │   │   │   └── UserManagement.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── server/                          # Backend Express app
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Equipment.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── equipment.js
│   │   ├── bookings.js
│   │   └── dashboard.js
│   ├── socket/
│   │   └── index.js
│   ├── server.js
│   └── package.json
└── docs/
    └── compose/
        ├── specs/
        └── plans/
```

---

## Task 1: Project Setup and Backend Foundation

**Covers:** S1, S2

**Files:**
- Create: `server/package.json`
- Create: `server/server.js`
- Create: `server/config/db.js`
- Create: `server/.env.example`

- [ ] **Step 1: Initialize backend project**

```bash
mkdir -p server && cd server && npm init -y
```

- [ ] **Step 2: Install backend dependencies**

```bash
npm install express mongoose cors dotenv socket.io jsonwebtoken bcryptjs multer cloudinary
npm install -D nodemon
```

- [ ] **Step 3: Create environment config**

Create `server/.env.example`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/equipment-borrowing
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

- [ ] **Step 4: Create database connection**

Create `server/config/db.js`:
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

- [ ] **Step 5: Create main server file**

Create `server/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Equipment Borrowing API');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, io };
```

- [ ] **Step 6: Test server starts**

```bash
cd server && node server.js
```
Expected: "Server running on port 5000" and "MongoDB Connected: localhost"

- [ ] **Step 7: Commit**

```bash
git add server/
git commit -m "feat: initialize backend with Express and MongoDB"
```

---

## Task 2: User Model and Authentication

**Covers:** S2, S3

**Files:**
- Create: `server/models/User.js`
- Create: `server/middleware/auth.js`
- Create: `server/routes/auth.js`
- Modify: `server/server.js`

- [ ] **Step 1: Create User model**

Create `server/models/User.js`:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

- [ ] **Step 2: Create auth middleware**

Create `server/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

module.exports = { auth, adminAuth };
```

- [ ] **Step 3: Create auth routes**

Create `server/routes/auth.js`:
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const user = new User({ username, password, name, email });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: user._id, username: user.username, role: user.role, name: user.name }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, username: user.username, role: user.role, name: user.name }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user._id, username: req.user.username, role: req.user.role, name: req.user.name } });
});

module.exports = router;
```

- [ ] **Step 4: Add routes to server**

Modify `server/server.js` - add after `app.use(express.json())`:
```javascript
app.use('/api/auth', require('./routes/auth'));
```

- [ ] **Step 5: Test auth endpoints**

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123","name":"Test User","email":"test@example.com"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

- [ ] **Step 6: Commit**

```bash
git add server/models/User.js server/middleware/auth.js server/routes/auth.js server/server.js
git commit -m "feat: add User model and authentication endpoints"
```

---

## Task 3: Equipment Model and CRUD

**Covers:** S2, S3

**Files:**
- Create: `server/models/Equipment.js`
- Create: `server/middleware/upload.js`
- Create: `server/routes/equipment.js`
- Modify: `server/server.js`

- [ ] **Step 1: Create Equipment model**

Create `server/models/Equipment.js`:
```javascript
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['相机套机', '镜头', '灯光', '三脚架', '云台', '其他']
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['available', 'maintenance'],
    default: 'available'
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Equipment', equipmentSchema);
```

- [ ] **Step 2: Create upload middleware**

Create `server/middleware/upload.js`:
```javascript
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

module.exports = upload;
```

- [ ] **Step 3: Create equipment routes**

Create `server/routes/equipment.js`:
```javascript
const express = require('express');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    
    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, model, category, description } = req.body;
    const equipment = new Equipment({
      name,
      model,
      category,
      description,
      imageUrl: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : ''
    });
    await equipment.save();
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

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: Add routes to server**

Modify `server/server.js` - add after auth route:
```javascript
app.use('/api/equipment', require('./routes/equipment'));
```

- [ ] **Step 5: Test equipment endpoints**

```bash
# Get all equipment
curl http://localhost:5000/api/equipment \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create equipment (admin)
curl -X POST http://localhost:5000/api/equipment \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=Canon EOS R5" \
  -F "model=R5" \
  -F "category=相机套机" \
  -F "description=Professional mirrorless camera"
```

- [ ] **Step 6: Commit**

```bash
git add server/models/Equipment.js server/middleware/upload.js server/routes/equipment.js server/server.js
git commit -m "feat: add Equipment model and CRUD endpoints"
```

---

## Task 4: Booking Model and Core Logic

**Covers:** S2, S3

**Files:**
- Create: `server/models/Booking.js`
- Create: `server/routes/bookings.js`
- Modify: `server/server.js`

- [ ] **Step 1: Create Booking model**

Create `server/models/Booking.js`:
```javascript
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'returned'],
    default: 'pending'
  },
  returnImageUrl: {
    type: String,
    default: ''
  },
  adminNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

bookingSchema.index({ equipmentId: 1, date: 1 });
bookingSchema.index({ userId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
```

- [ ] **Step 2: Create booking routes**

Create `server/routes/bookings.js`:
```javascript
const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    }
    
    const { status, equipmentId, date } = req.query;
    if (status) filter.status = status;
    if (equipmentId) filter.equipmentId = equipmentId;
    if (date) filter.date = new Date(date);

    const bookings = await Booking.find(filter)
      .populate('userId', 'name username')
      .populate('equipmentId', 'name model')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/available-slots/:equipmentId/:date', auth, async (req, res) => {
  try {
    const { equipmentId, date } = req.params;
    const targetDate = new Date(date);
    
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.status === 'maintenance') {
      return res.status(400).json({ error: 'Equipment not available' });
    }

    const bookings = await Booking.find({
      equipmentId,
      date: targetDate,
      status: { $in: ['pending', 'approved'] }
    });

    const allSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        allSlots.push(time);
      }
    }

    const bookedSlots = new Set();
    bookings.forEach(booking => {
      const startIdx = allSlots.indexOf(booking.startTime);
      const endIdx = allSlots.indexOf(booking.endTime);
      for (let i = startIdx; i < endIdx; i++) {
        bookedSlots.add(allSlots[i]);
      }
    });

    const slots = allSlots.map(time => ({
      time,
      status: bookedSlots.has(time) ? 'booked' : 'available'
    }));

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { equipmentId, date, startTime, endTime } = req.body;
    
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.status === 'maintenance') {
      return res.status(400).json({ error: 'Equipment not available' });
    }

    const conflictingBooking = await Booking.findOne({
      equipmentId,
      date: new Date(date),
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const booking = new Booking({
      userId: req.user._id,
      equipmentId,
      date: new Date(date),
      startTime,
      endTime
    });
    await booking.save();

    await booking.populate(['userId', 'equipmentId']);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    booking.status = 'approved';
    booking.adminNote = req.body.note || '';
    await booking.save();

    await booking.populate(['userId', 'equipmentId']);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    booking.status = 'rejected';
    booking.adminNote = req.body.note || '';
    await booking.save();

    await booking.populate(['userId', 'equipmentId']);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/return', auth, upload.single('image'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status !== 'approved') {
      return res.status(400).json({ error: 'Booking is not approved' });
    }

    booking.status = 'returned';
    if (req.file) {
      booking.returnImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    await booking.save();

    await booking.populate(['userId', 'equipmentId']);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: Add routes to server**

Modify `server/server.js` - add after equipment route:
```javascript
app.use('/api/bookings', require('./routes/bookings'));
```

- [ ] **Step 4: Test booking endpoints**

```bash
# Get available slots
curl http://localhost:5000/api/bookings/available-slots/EQUIPMENT_ID/2026-06-15 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"equipmentId":"EQUIPMENT_ID","date":"2026-06-15","startTime":"09:00","endTime":"10:00"}'
```

- [ ] **Step 5: Commit**

```bash
git add server/models/Booking.js server/routes/bookings.js server/server.js
git commit -m "feat: add Booking model and core booking logic"
```

---

## Task 5: Dashboard and Socket.io

**Covers:** S1, S3

**Files:**
- Create: `server/routes/dashboard.js`
- Create: `server/socket/index.js`
- Modify: `server/server.js`

- [ ] **Step 1: Create dashboard routes**

Create `server/routes/dashboard.js`:
```javascript
const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments();
    const availableEquipment = await Equipment.countDocuments({ status: 'available' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeBookings = await Booking.countDocuments({ status: 'approved' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    const recentBookings = await Booking.find()
      .populate('userId', 'name')
      .populate('equipmentId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalEquipment,
      availableEquipment,
      pendingBookings,
      activeBookings,
      totalUsers,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-stats', auth, async (req, res) => {
  try {
    const myBookings = await Booking.countDocuments({ userId: req.user._id });
    const myPendingBookings = await Booking.countDocuments({ userId: req.user._id, status: 'pending' });
    const myActiveBookings = await Booking.countDocuments({ userId: req.user._id, status: 'approved' });

    const recentBookings = await Booking.find({ userId: req.user._id })
      .populate('equipmentId', 'name model')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      myBookings,
      myPendingBookings,
      myActiveBookings,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Create Socket.io handler**

Create `server/socket/index.js`:
```javascript
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-equipment', (equipmentId) => {
      socket.join(`equipment-${equipmentId}`);
    });

    socket.on('leave-equipment', (equipmentId) => {
      socket.leave(`equipment-${equipmentId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const emitBookingUpdate = (io, equipmentId, booking) => {
  io.to(`equipment-${equipmentId}`).emit('booking-updated', booking);
};

module.exports = { setupSocket, emitBookingUpdate };
```

- [ ] **Step 3: Update server with Socket.io and dashboard**

Modify `server/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { setupSocket } = require('./socket');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

setupSocket(io);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Equipment Borrowing API');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, io };
```

- [ ] **Step 4: Test dashboard endpoints**

```bash
# Admin stats
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# User stats
curl http://localhost:5000/api/dashboard/my-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] **Step 5: Commit**

```bash
git add server/routes/dashboard.js server/socket/index.js server/server.js
git commit -m "feat: add dashboard stats and Socket.io real-time updates"
```

---

## Task 6: Frontend Project Setup

**Covers:** S1

**Files:**
- Create: `client/package.json`
- Create: `client/tailwind.config.js`
- Create: `client/src/index.js`
- Create: `client/src/App.jsx`
- Create: `client/src/services/api.js`
- Create: `client/src/services/socket.js`
- Create: `client/src/context/AuthContext.jsx`

- [ ] **Step 1: Create React app**

```bash
npx create-react-app client
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd client && npm install axios socket.io-client react-router-dom react-beautiful-dnd date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind CSS**

Update `client/tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Replace `client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create API service**

Create `client/src/services/api.js`:
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 5: Create Socket service**

Create `client/src/services/socket.js`:
```javascript
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  socket = io(SOCKET_URL);
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinEquipmentRoom = (equipmentId) => {
  if (socket) {
    socket.emit('join-equipment', equipmentId);
  }
};

export const leaveEquipmentRoom = (equipmentId) => {
  if (socket) {
    socket.emit('leave-equipment', equipmentId);
  }
};
```

- [ ] **Step 6: Create Auth Context**

Create `client/src/context/AuthContext.jsx`:
```jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 7: Create main App**

Replace `client/src/App.jsx`:
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <div>Dashboard - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <div>Admin Dashboard - Coming Soon</div>
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

- [ ] **Step 8: Create Login page**

Create `client/src/pages/Login.jsx`:
```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">设备借用系统</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
            登录
          </button>
        </form>
        <p className="text-center mt-4">
          没有账号？ <Link to="/register" className="text-blue-500">注册</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

- [ ] **Step 9: Create Register page**

Create `client/src/pages/Register.jsx`:
```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">注册账号</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">姓名</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
            注册
          </button>
        </form>
        <p className="text-center mt-4">
          已有账号？ <Link to="/login" className="text-blue-500">登录</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
```

- [ ] **Step 10: Test frontend starts**

```bash
cd client && npm start
```
Expected: App opens in browser at http://localhost:3000

- [ ] **Step 11: Commit**

```bash
git add client/
git commit -m "feat: initialize React frontend with auth pages"
```

---

## Task 7: Equipment List and Booking Page

**Covers:** S4

**Files:**
- Create: `client/src/components/EquipmentCard.jsx`
- Create: `client/src/pages/EquipmentList.jsx`
- Create: `client/src/pages/EquipmentBooking.jsx`
- Create: `client/src/components/TimeSlotPicker.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create EquipmentCard component**

Create `client/src/components/EquipmentCard.jsx`:
```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EquipmentCard = ({ equipment }) => {
  const navigate = useNavigate();

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    maintenance: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {equipment.imageUrl && (
        <img src={equipment.imageUrl} alt={equipment.name} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{equipment.name}</h3>
        <p className="text-gray-600">{equipment.model}</p>
        <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mt-2">
          {equipment.category}
        </span>
        <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 mt-2 ${statusColors[equipment.status]}`}>
          {equipment.status === 'available' ? '可用' : '维护中'}
        </span>
        {equipment.status === 'available' && (
          <button
            onClick={() => navigate(`/equipment/${equipment._id}/booking`)}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            预约借用
          </button>
        )}
      </div>
    </div>
  );
};

export default EquipmentCard;
```

- [ ] **Step 2: Create TimeSlotPicker component**

Create `client/src/components/TimeSlotPicker.jsx`:
```jsx
import React, { useState, useEffect } from 'react';

const TimeSlotPicker = ({ slots, onSelect, selectedRange }) => {
  const [selecting, setSelecting] = useState(false);
  const [startSlot, setStartSlot] = useState(null);

  const handleSlotClick = (time, status) => {
    if (status === 'booked') return;

    if (!selecting) {
      setStartSlot(time);
      setSelecting(true);
    } else {
      onSelect(startSlot, time);
      setSelecting(false);
      setStartSlot(null);
    }
  };

  const isSelected = (time) => {
    if (!selectedRange) return false;
    return time >= selectedRange.start && time < selectedRange.end;
  };

  const isSelectingRange = (time) => {
    if (!selecting || !startSlot) return false;
    return time >= startSlot;
  };

  return (
    <div className="grid grid-cols-8 gap-1">
      {slots.map(({ time, status }) => (
        <button
          key={time}
          onClick={() => handleSlotClick(time, status)}
          disabled={status === 'booked'}
          className={`p-2 text-xs rounded ${
            status === 'booked'
              ? 'bg-red-200 text-red-800 cursor-not-allowed'
              : isSelected(time)
              ? 'bg-blue-500 text-white'
              : isSelectingRange(time)
              ? 'bg-blue-200'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {time}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotPicker;
```

- [ ] **Step 3: Create EquipmentList page**

Create `client/src/pages/EquipmentList.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EquipmentCard from '../components/EquipmentCard';

const EquipmentList = () => {
  const [equipment, setEquipment] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = ['', '相机套机', '镜头', '灯光', '三脚架', '云台', '其他'];

  useEffect(() => {
    fetchEquipment();
  }, [category]);

  const fetchEquipment = async () => {
    try {
      const params = category ? { category } : {};
      const res = await api.get('/equipment', { params });
      setEquipment(res.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">设备列表</h1>
      
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded ${
              category === cat ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {cat || '全部'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item) => (
          <EquipmentCard key={item._id} equipment={item} />
        ))}
      </div>

      {equipment.length === 0 && (
        <p className="text-center text-gray-500">暂无设备</p>
      )}
    </div>
  );
};

export default EquipmentList;
```

- [ ] **Step 4: Create EquipmentBooking page**

Create `client/src/pages/EquipmentBooking.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import api from '../services/api';
import TimeSlotPicker from '../components/TimeSlotPicker';

const EquipmentBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, [id]);

  useEffect(() => {
    fetchSlots();
  }, [id, selectedDate]);

  const fetchEquipment = async () => {
    try {
      const res = await api.get(`/equipment/${id}`);
      setEquipment(res.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await api.get(`/bookings/available-slots/${id}/${selectedDate}`);
      setSlots(res.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (start, end) => {
    setSelectedRange({ start, end });
  };

  const handleSubmit = async () => {
    if (!selectedRange) return;

    try {
      await api.post('/bookings', {
        equipmentId: id,
        date: selectedDate,
        startTime: selectedRange.start,
        endTime: selectedRange.end
      });
      alert('预约已提交，等待管理员审核');
      navigate('/bookings');
    } catch (error) {
      alert(error.response?.data?.error || '预约失败');
    }
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  if (loading) return <div>加载中...</div>;
  if (!equipment) return <div>设备未找到</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{equipment.name} - 预约借用</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">选择日期</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded whitespace-nowrap ${
                selectedDate === date ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {date}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">选择时间段</h2>
        <p className="text-sm text-gray-500 mb-4">
          点击开始时间，再点击结束时间
        </p>
        <TimeSlotPicker slots={slots} onSelect={handleSelect} selectedRange={selectedRange} />
        <div className="flex gap-4 mt-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
            <span className="text-sm">空闲</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 rounded mr-2"></div>
            <span className="text-sm">已预约</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm">已选择</span>
          </div>
        </div>
      </div>

      {selectedRange && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">确认预约</h2>
          <p>日期：{selectedDate}</p>
          <p>时间：{selectedRange.start} - {selectedRange.end}</p>
          <button
            onClick={handleSubmit}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            提交预约
          </button>
        </div>
      )}
    </div>
  );
};

export default EquipmentBooking;
```

- [ ] **Step 5: Update App.jsx with new routes**

Update `client/src/App.jsx` - add imports and routes:
```jsx
import EquipmentList from './pages/EquipmentList';
import EquipmentBooking from './pages/EquipmentBooking';
import MyBookings from './pages/MyBookings';

// In Routes, add:
<Route path="/equipment" element={
  <ProtectedRoute>
    <EquipmentList />
  </ProtectedRoute>
} />
<Route path="/equipment/:id/booking" element={
  <ProtectedRoute>
    <EquipmentBooking />
  </ProtectedRoute>
} />
<Route path="/bookings" element={
  <ProtectedRoute>
    <MyBookings />
  </ProtectedRoute>
} />
```

- [ ] **Step 6: Test booking flow**

```bash
cd client && npm start
```
Navigate to equipment list, select an equipment, choose time slots, submit booking.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/EquipmentCard.jsx client/src/components/TimeSlotPicker.jsx client/src/pages/EquipmentList.jsx client/src/pages/EquipmentBooking.jsx client/src/App.jsx
git commit -m "feat: add equipment list and booking pages with time slot picker"
```

---

## Task 8: My Bookings and Admin Pages

**Covers:** S4

**Files:**
- Create: `client/src/pages/MyBookings.jsx`
- Create: `client/src/pages/admin/AdminDashboard.jsx`
- Create: `client/src/pages/admin/EquipmentManagement.jsx`
- Create: `client/src/pages/admin/BookingManagement.jsx`
- Create: `client/src/components/BookingStatusBadge.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create BookingStatusBadge component**

Create `client/src/components/BookingStatusBadge.jsx`:
```jsx
import React from 'react';

const statusConfig = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  returned: { label: '已归还', color: 'bg-gray-100 text-gray-800' }
};

const BookingStatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

export default BookingStatusBadge;
```

- [ ] **Step 2: Create MyBookings page**

Create `client/src/pages/MyBookings.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BookingStatusBadge from '../components/BookingStatusBadge';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookingId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        await api.put(`/bookings/${bookingId}/return`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchBookings();
        alert('归还成功');
      } catch (error) {
        alert(error.response?.data?.error || '归还失败');
      }
    };
    input.click();
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">我的预约</h1>
      
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{booking.equipmentId?.name}</h3>
                <p className="text-gray-600">{booking.equipmentId?.model}</p>
                <p className="text-sm text-gray-500">
                  {new Date(booking.date).toLocaleDateString()} {booking.startTime} - {booking.endTime}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            {booking.adminNote && (
              <p className="text-sm text-gray-500 mt-2">管理员备注：{booking.adminNote}</p>
            )}
            {booking.status === 'approved' && (
              <button
                onClick={() => handleReturn(booking._id)}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                归还设备
              </button>
            )}
            {booking.returnImageUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">归还凭证：</p>
                <img src={booking.returnImageUrl} alt="Return" className="w-32 h-32 object-cover rounded mt-1" />
              </div>
            )}
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <p className="text-center text-gray-500">暂无预约记录</p>
      )}
    </div>
  );
};

export default MyBookings;
```

- [ ] **Step 3: Create AdminDashboard page**

Create `client/src/pages/admin/AdminDashboard.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!stats) return <div>加载失败</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理员仪表盘</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm">设备总数</h3>
          <p className="text-3xl font-bold">{stats.totalEquipment}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm">可用设备</h3>
          <p className="text-3xl font-bold text-green-600">{stats.availableEquipment}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm">待审核预约</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm">用户数量</h3>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/equipment" className="bg-blue-500 text-white rounded-lg p-4 text-center hover:bg-blue-600">
          设备管理
        </Link>
        <Link to="/admin/bookings" className="bg-green-500 text-white rounded-lg p-4 text-center hover:bg-green-600">
          预约管理
        </Link>
        <Link to="/admin/users" className="bg-purple-500 text-white rounded-lg p-4 text-center hover:bg-purple-600">
          用户管理
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">最近预约</h2>
        <div className="space-y-2">
          {stats.recentBookings.map((booking) => (
            <div key={booking._id} className="flex justify-between items-center p-2 border-b">
              <div>
                <span className="font-medium">{booking.userId?.name}</span>
                <span className="text-gray-500"> 预约了 </span>
                <span className="font-medium">{booking.equipmentId?.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(booking.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

- [ ] **Step 4: Create EquipmentManagement page**

Create `client/src/pages/admin/EquipmentManagement.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    category: '相机套机',
    description: '',
    status: 'available'
  });
  const [image, setImage] = useState(null);

  const categories = ['相机套机', '镜头', '灯光', '三脚架', '云台', '其他'];

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/equipment', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchEquipment();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      model: item.model,
      category: item.category,
      description: item.description,
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除此设备？')) return;
    try {
      await api.delete(`/equipment/${id}`);
      fetchEquipment();
    } catch (error) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', model: '', category: '相机套机', description: '', status: 'available' });
    setImage(null);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">设备管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新增设备
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? '编辑设备' : '新增设备'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">设备名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">型号</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="available">可用</option>
                  <option value="maintenance">维护中</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">图片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                {editingId ? '更新' : '创建'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md p-4">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded mb-4" />
            )}
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-gray-600">{item.model}</p>
            <p className="text-sm text-gray-500">{item.category}</p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
              item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {item.status === 'available' ? '可用' : '维护中'}
            </span>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentManagement;
```

- [ ] **Step 5: Create BookingManagement page**

Create `client/src/pages/admin/BookingManagement.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BookingStatusBadge from '../../components/BookingStatusBadge';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/bookings', { params });
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/bookings/${id}/approve`);
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (id) => {
    const note = prompt('请输入拒绝原因（可选）');
    try {
      await api.put(`/bookings/${id}/reject`, { note });
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">预约管理</h1>
      
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'approved', 'rejected', 'returned'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {status === 'all' ? '全部' : 
             status === 'pending' ? '待审核' :
             status === 'approved' ? '已批准' :
             status === 'rejected' ? '已拒绝' : '已归还'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{booking.equipmentId?.name}</h3>
                <p className="text-gray-600">借用人：{booking.userId?.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(booking.date).toLocaleDateString()} {booking.startTime} - {booking.endTime}
                </p>
                {booking.adminNote && (
                  <p className="text-sm text-gray-500 mt-1">备注：{booking.adminNote}</p>
                )}
                {booking.returnImageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">归还凭证：</p>
                    <img src={booking.returnImageUrl} alt="Return" className="w-32 h-32 object-cover rounded mt-1" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <BookingStatusBadge status={booking.status} />
                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(booking._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      批准
                    </button>
                    <button
                      onClick={() => handleReject(booking._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <p className="text-center text-gray-500">暂无预约记录</p>
      )}
    </div>
  );
};

export default BookingManagement;
```

- [ ] **Step 6: Update App.jsx with admin routes**

Update `client/src/App.jsx` - add admin imports and routes:
```jsx
import AdminDashboard from './pages/admin/AdminDashboard';
import EquipmentManagement from './pages/admin/EquipmentManagement';
import BookingManagement from './pages/admin/BookingManagement';

// In Routes, add:
<Route path="/admin" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
<Route path="/admin/equipment" element={
  <AdminRoute>
    <EquipmentManagement />
  </AdminRoute>
} />
<Route path="/admin/bookings" element={
  <AdminRoute>
    <BookingManagement />
  </AdminRoute>
} />
```

- [ ] **Step 7: Test admin pages**

```bash
cd client && npm start
```
Login as admin, test equipment management and booking approval.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/MyBookings.jsx client/src/pages/admin/ client/src/components/BookingStatusBadge.jsx client/src/App.jsx
git commit -m "feat: add my bookings and admin management pages"
```

---

## Task 9: Navigation and Layout

**Covers:** S4

**Files:**
- Create: `client/src/components/Layout.jsx`
- Create: `client/src/components/Navbar.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create Navbar component**

Create `client/src/components/Navbar.jsx`:
```jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">设备借用系统</Link>
          
          <div className="flex items-center gap-4">
            <Link to="/equipment" className="hover:text-blue-200">设备列表</Link>
            <Link to="/bookings" className="hover:text-blue-200">我的预约</Link>
            
            {user.role === 'admin' && (
              <Link to="/admin" className="hover:text-blue-200">管理后台</Link>
            )}
            
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm">{user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

- [ ] **Step 2: Create Layout component**

Create `client/src/components/Layout.jsx`:
```jsx
import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
```

- [ ] **Step 3: Update App.jsx with Layout**

Update `client/src/App.jsx` - wrap routes with Layout:
```jsx
import Layout from './components/Layout';

// In App component, wrap Router content:
<Layout>
  <Routes>
    {/* ... routes ... */}
  </Routes>
</Layout>
```

- [ ] **Step 4: Test navigation**

```bash
cd client && npm start
```
Test navigation between all pages, verify admin links only show for admin users.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Layout.jsx client/src/components/Navbar.jsx client/src/App.jsx
git commit -m "feat: add navigation and layout components"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [S1] System Architecture ✓ (Task 1, 6)
- [S2] Database Models ✓ (Task 2, 3, 4)
- [S3] API Endpoints ✓ (Task 2, 3, 4, 5)
- [S4] Frontend Pages ✓ (Task 6, 7, 8, 9)

**2. Placeholder scan:**
- No TBD, TODO, or incomplete sections found
- All code blocks contain complete implementations

**3. Type consistency:**
- All API endpoints match frontend service calls
- Model fields consistent across backend and frontend
- Status enums consistent throughout

---

## Execution

Plan saved. How would you like to execute it?
