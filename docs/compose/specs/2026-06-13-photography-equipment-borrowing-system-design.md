# Photography Equipment Borrowing System Design

## [S1] System Architecture

**Frontend**: React SPA + Tailwind CSS
- **Hosting**: Vercel (免费托管，全球CDN)
- **访问**: 手机、校外设备任意浏览器打开

**Backend**: Node.js + Express REST API
- **Hosting**: Render/Railway (免费云服务器)
- **优势**: 关机本地电脑不影响系统运行

**Database**: MongoDB Atlas (免费云数据库)

**Real-time**: Socket.io for live updates

**Image Storage**: Cloudinary (免费额度)

**Key Libraries**:
- Frontend: react-beautiful-dnd (drag & drop), date-fns (time handling), axios (HTTP)
- Backend: jsonwebtoken, bcryptjs, multer (file upload), socket.io

## [S2] Database Models

**User**
- id, username, password (hashed), role (admin/user), name, email, createdAt

**Equipment**
- id, name, model, category (相机套机/镜头/灯光/三脚架/云台/其他), description, status (available/maintenance), imageUrl, createdAt

**Booking**
- id, userId, equipmentId, date, startTime, endTime, status (pending/approved/rejected/returned), createdAt
- returnImageUrl (uploaded when returned)
- adminNote (rejection reason or notes)

**Key Relationships**:
- User has many Bookings
- Equipment has many Bookings
- Booking belongs to User and Equipment

## [S3] API Endpoints

**Auth**
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录
- GET /api/auth/me - 获取当前用户

**Equipment (Admin)**
- GET /api/equipment - 获取设备列表（支持category筛选）
- POST /api/equipment - 新增设备
- PUT /api/equipment/:id - 更新设备
- DELETE /api/equipment/:id - 删除设备

**Bookings**
- GET /api/bookings - 获取预约列表
- POST /api/bookings - 创建预约
- PUT /api/bookings/:id/approve - 批准预约（Admin）
- PUT /api/bookings/:id/reject - 拒绝预约（Admin）
- PUT /api/bookings/:id/return - 归还设备（上传图片）

**Dashboard**
- GET /api/dashboard/stats - 获取统计数据

## [S4] Frontend Pages

**公共页面**
- /login - 登录页面
- /register - 注册页面

**使用者页面**
- /dashboard - 仪表盘（显示我的预约、设备状态）
- /equipment - 设备列表（按分类筛选）
- /equipment/:id/booking - 设备预约页面（拖拽选择时间段）
- /bookings - 我的预约记录

**管理员页面**
- /admin/dashboard - 管理员仪表盘（统计数据、待审核预约）
- /admin/equipment - 设备管理（新增、编辑、删除）
- /admin/bookings - 预约管理（审核、查看记录）
- /admin/users - 用户管理

**核心交互**
- 时间段选择：30分钟时间段，0:00-24:00（24小时），使用拖拽组件，绿色=空闲，红色=已预约
- 实时更新：WebSocket推送设备状态变化
- 图片上传：归还时上传图片凭证
