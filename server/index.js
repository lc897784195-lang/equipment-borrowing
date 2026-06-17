const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: process.env.TCB_ENV || 'recent-d4gjmvv2t6ac8f923',
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
});

const db = app.database();
const _ = db.command;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function ok(data, statusCode = 200) {
  return { statusCode, headers: CORS, body: JSON.stringify(data) };
}

function err(msg, statusCode = 400) {
  return ok({ error: msg }, statusCode);
}

function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch { return null; }
}

async function route(method, path, body, query, headers) {
  if (method === 'OPTIONS') return ok({});

  // POST /auth/register
  if (method === 'POST' && path === '/auth/register') {
    const { username, password, role } = body;
    if (!username || !password) return err('用户名和密码必填');
    const existing = await db.collection('users').where({ username }).get();
    if (existing.data.length > 0) return err('用户名已存在');
    const hashed = await bcrypt.hash(password, 10);
    const res = await db.collection('users').add({
      username, password: hashed, name: username, role: role || 'user', createdAt: new Date()
    });
    const token = jwt.sign({ id: res.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return ok({ user: { id: res.id, username, role: role || 'user', name: username }, token });
  }

  // POST /auth/login
  if (method === 'POST' && path === '/auth/login') {
    const { username, password } = body;
    if (!username || !password) return err('用户名和密码必填');
    const res = await db.collection('users').where({ username }).get();
    if (res.data.length === 0) return err('用户名或密码错误', 401);
    const user = res.data[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return err('用户名或密码错误', 401);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return ok({ user: { id: user._id, username: user.username, role: user.role, name: user.name }, token });
  }

  // GET /auth/me
  if (method === 'GET' && path === '/auth/me') {
    const decoded = getUser(headers.authorization);
    if (!decoded) return err('未登录', 401);
    const res = await db.collection('users').doc(decoded.id).get();
    if (!res.data.length) return err('用户不存在', 401);
    const u = res.data[0];
    return ok({ user: { id: u._id, username: u.username, role: u.role, name: u.name } });
  }

  // 以下接口需要登录
  const decoded = getUser(headers.authorization);
  if (!decoded) return err('未登录', 401);
  const userRes = await db.collection('users').doc(decoded.id).get();
  if (!userRes.data.length) return err('用户不存在', 401);
  const currentUser = userRes.data[0];
  const isAdmin = currentUser.role === 'admin';

  // GET /equipment
  if (method === 'GET' && path === '/equipment') {
    let q = {};
    if (query.category) q.category = query.category;
    const res = await db.collection('equipment').where(q).orderBy('createdAt', 'desc').get();
    return ok(res.data);
  }

  // GET /equipment/:id
  if (method === 'GET' && path.startsWith('/equipment/') && path.split('/').length === 3) {
    const id = path.split('/')[2];
    const res = await db.collection('equipment').doc(id).get();
    if (!res.data.length) return err('设备未找到', 404);
    return ok(res.data[0]);
  }

  // POST /equipment (admin)
  if (method === 'POST' && path === '/equipment') {
    if (!isAdmin) return err('需要管理员权限', 403);
    const { name, model, category, description } = body;
    const res = await db.collection('equipment').add({
      name, model, category, description: description || '', status: 'available', imageUrl: '', createdAt: new Date()
    });
    return ok({ _id: res.id, name, model, category, description, status: 'available' }, 201);
  }

  // PUT /equipment/:id (admin)
  if (method === 'PUT' && path.startsWith('/equipment/') && path.split('/').length === 3) {
    if (!isAdmin) return err('需要管理员权限', 403);
    const id = path.split('/')[2];
    await db.collection('equipment').doc(id).update(body);
    const res = await db.collection('equipment').doc(id).get();
    return ok(res.data[0]);
  }

  // DELETE /equipment/:id (admin)
  if (method === 'DELETE' && path.startsWith('/equipment/') && path.split('/').length === 3) {
    if (!isAdmin) return err('需要管理员权限', 403);
    const id = path.split('/')[2];
    await db.collection('equipment').doc(id).remove();
    return ok({ message: '设备已删除' });
  }

  // GET /bookings
  if (method === 'GET' && path === '/bookings') {
    let q = {};
    if (!isAdmin) q.userId = decoded.id;
    if (query.status) q.status = query.status;
    if (query.equipmentId) q.equipmentId = query.equipmentId;
    const res = await db.collection('bookings').where(q).orderBy('createdAt', 'desc').get();
    const bookings = await Promise.all(res.data.map(async (b) => {
      const u = await db.collection('users').doc(b.userId).get();
      const e = await db.collection('equipment').doc(b.equipmentId).get();
      return {
        ...b,
        userId: u.data.length ? { _id: u.data[0]._id, name: u.data[0].name, username: u.data[0].username } : null,
        equipmentId: e.data.length ? { _id: e.data[0]._id, name: e.data[0].name, model: e.data[0].model } : null
      };
    }));
    return ok(bookings);
  }

  // GET /bookings/available-slots/:id/:date
  const slotsMatch = path.match(/^\/bookings\/available-slots\/([^/]+)\/([^/]+)$/);
  if (method === 'GET' && slotsMatch) {
    const [, equipmentId, date] = slotsMatch;
    const eqRes = await db.collection('equipment').doc(equipmentId).get();
    if (!eqRes.data.length || eqRes.data[0].status === 'maintenance') return err('设备不可用');
    const bkRes = await db.collection('bookings').where({
      equipmentId, date, status: _.in(['pending', 'approved'])
    }).get();
    const allSlots = [];
    for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) {
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    const booked = new Set();
    bkRes.data.forEach(b => {
      const si = allSlots.indexOf(b.startTime);
      const ei = allSlots.indexOf(b.endTime);
      for (let i = si; i < ei; i++) booked.add(allSlots[i]);
    });
    return ok(allSlots.map(t => ({ time: t, status: booked.has(t) ? 'booked' : 'available' })));
  }

  // POST /bookings
  if (method === 'POST' && path === '/bookings') {
    const { equipmentId, date, startTime, endTime } = body;
    const eqRes = await db.collection('equipment').doc(equipmentId).get();
    if (!eqRes.data.length || eqRes.data[0].status === 'maintenance') return err('设备不可用');
    const conflict = await db.collection('bookings').where({
      equipmentId, date, status: _.in(['pending', 'approved']),
      startTime: _.lt(endTime), endTime: _.gt(startTime)
    }).get();
    if (conflict.data.length > 0) return err('该时间段已被预约');
    const res = await db.collection('bookings').add({
      userId: decoded.id, equipmentId, date, startTime, endTime,
      status: 'pending', returnImageUrl: '', adminNote: '', createdAt: new Date()
    });
    return ok({ _id: res.id, ...body, status: 'pending' }, 201);
  }

  // PUT /bookings/:id/approve (admin)
  const approveMatch = path.match(/^\/bookings\/([^/]+)\/approve$/);
  if (method === 'PUT' && approveMatch) {
    if (!isAdmin) return err('需要管理员权限', 403);
    const id = approveMatch[1];
    await db.collection('bookings').doc(id).update({ status: 'approved', adminNote: body?.note || '' });
    const res = await db.collection('bookings').doc(id).get();
    return ok(res.data[0]);
  }

  // PUT /bookings/:id/reject (admin)
  const rejectMatch = path.match(/^\/bookings\/([^/]+)\/reject$/);
  if (method === 'PUT' && rejectMatch) {
    if (!isAdmin) return err('需要管理员权限', 403);
    const id = rejectMatch[1];
    await db.collection('bookings').doc(id).update({ status: 'rejected', adminNote: body?.note || '' });
    const res = await db.collection('bookings').doc(id).get();
    return ok(res.data[0]);
  }

  // PUT /bookings/:id/return
  const returnMatch = path.match(/^\/bookings\/([^/]+)\/return$/);
  if (method === 'PUT' && returnMatch) {
    const id = returnMatch[1];
    const bkRes = await db.collection('bookings').doc(id).get();
    if (!bkRes.data.length) return err('预约未找到', 404);
    const booking = bkRes.data[0];
    if (booking.userId !== decoded.id && !isAdmin) return err('无权操作', 403);
    if (booking.status !== 'approved') return err('预约状态不是已批准');
    await db.collection('bookings').doc(id).update({ status: 'returned' });
    const updated = await db.collection('bookings').doc(id).get();
    return ok(updated.data[0]);
  }

  // GET /dashboard/stats (admin)
  if (method === 'GET' && path === '/dashboard/stats') {
    if (!isAdmin) return err('需要管理员权限', 403);
    const [totalEq, availEq, pendBk, actBk, totalUs, recent] = await Promise.all([
      db.collection('equipment').count(),
      db.collection('equipment').where({ status: 'available' }).count(),
      db.collection('bookings').where({ status: 'pending' }).count(),
      db.collection('bookings').where({ status: 'approved' }).count(),
      db.collection('users').where({ role: 'user' }).count(),
      db.collection('bookings').orderBy('createdAt', 'desc').limit(5).get()
    ]);
    return ok({
      totalEquipment: totalEq.total, availableEquipment: availEq.total,
      pendingBookings: pendBk.total, activeBookings: actBk.total,
      totalUsers: totalUs.total, recentBookings: recent.data
    });
  }

  // GET /dashboard/my-stats
  if (method === 'GET' && path === '/dashboard/my-stats') {
    const [myTotal, myPend, myAct, recent] = await Promise.all([
      db.collection('bookings').where({ userId: decoded.id }).count(),
      db.collection('bookings').where({ userId: decoded.id, status: 'pending' }).count(),
      db.collection('bookings').where({ userId: decoded.id, status: 'approved' }).count(),
      db.collection('bookings').where({ userId: decoded.id }).orderBy('createdAt', 'desc').limit(5).get()
    ]);
    return ok({
      myBookings: myTotal.total, myPendingBookings: myPend.total,
      myActiveBookings: myAct.total, recentBookings: recent.data
    });
  }

  // GET /
  if (method === 'GET' && (path === '/' || path === '')) {
    return ok({ status: 'ok', message: 'Equipment Borrowing API' });
  }

  return err('Not Found', 404);
}

exports.main = async (event, context) => {
  try {
    const { httpMethod, path: rawPath, body, headers, queryString } = event;
    const path = rawPath || '/';
    const parsedBody = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
    const query = queryString || {};
    return await route(httpMethod, path, parsedBody, query, headers || {});
  } catch (e) {
    return err(e.message, 500);
  }
};
