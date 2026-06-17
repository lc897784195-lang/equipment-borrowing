# 摄影部设备借用管理系统

一个用于摄影部设备借用管理的 Web 系统，支持管理员与普通用户双角色，可在线预约设备、审核借用申请、管理设备信息。

## 功能特性

### 普通用户
- 注册/登录（支持中文用户名）
- 浏览设备列表（按分类筛选）
- 预约设备（选择日期和时间段）
- 查看我的预约记录
- 归还设备

### 管理员
- 管理设备（新增、编辑、删除）
- 审核预约（批准/拒绝）
- 查看所有预约记录
- 仪表盘统计数据

## 技术栈

- **前端**：React + Vite + Tailwind CSS
- **后端**：Node.js + 腾讯云云函数
- **数据库**：腾讯云 CloudBase 数据库
- **部署**：腾讯云 CloudBase（静态托管 + 云函数）

## 部署到自己的腾讯云

### 前提条件

1. 注册 [腾讯云账号](https://cloud.tencent.com)
2. 开通 [CloudBase](https://console.cloud.tencent.com/tcb)（免费版即可）

### 第1步：获取密钥

1. 登录腾讯云，打开 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 点击「新建密钥」，记录 **SecretId** 和 **SecretKey**

### 第2步：创建 CloudBase 环境

1. 打开 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 点击「创建环境」，选择「免费版」
3. 记录 **环境ID**（类似 `your-env-id`）

### 第3步：创建云数据库集合

在 CloudBase 控制台 → 数据库，创建以下集合：

- `users`
- `equipment`
- `bookings`

### 第4步：克隆项目

```bash
git clone https://github.com/lc897784195-lang/equipment-borrowing.git
cd equipment-borrowing
```

### 第5步：配置环境变量

编辑 `server/.env` 文件：

```env
PORT=5001
JWT_SECRET=你的JWT密钥（随便写一串复杂字符）
TCB_ENV=你的环境ID
TCB_SECRET_ID=你的SecretId
TCB_SECRET_KEY=你的SecretKey
```

### 第6步：安装依赖

```bash
# 安装后端依赖
cd server && npm install && cd ..

# 安装前端依赖
cd client && npm install --legacy-peer-deps && cd ..

# 安装 CloudBase CLI
npm install @cloudbase/cli --legacy-peer-deps
```

### 第7步：登录 CloudBase CLI

```bash
npx tcb login --apiKeyId 你的SecretId --apiKey 你的SecretKey
```

### 第8步：部署后端云函数

```bash
# 部署云函数
npx tcb fn deploy api -e 你的环境ID --force --yes --dir ./server

# 创建 HTTP 访问服务
npx tcb service create -e 你的环境ID -p api -f api
```

部署成功后会显示 API 访问地址，类似：
```
https://your-env-id-xxx.ap-shanghai.app.tcloudbase.com/api
```

### 第9步：配置前端 API 地址

编辑 `client/src/services/api.js`，将 `API_URL` 改为你的后端地址：

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://你的API地址/api';
```

### 第10步：部署前端

```bash
cd client
npx tcb app deploy --framework vite -e 你的环境ID --install-command "npm install --legacy-peer-deps" --force --yes
```

部署成功后会显示访问地址。

### 第11步：设置管理员

注册第一个账号后，需要手动设置为管理员：

在 CloudBase 控制台 → 数据库 → `users` 集合，找到你的用户记录，将 `role` 字段改为 `admin`。

## 本地开发

```bash
# 启动后端
cd server && npm start

# 启动前端（新终端）
cd client && npm run dev
```

访问 http://localhost:5173

## 项目结构

```
equipment-borrowing/
├── client/                # 前端 React 应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── context/       # 状态管理
│   │   └── services/      # API 服务
│   └── package.json
├── server/                # 后端云函数
│   ├── index.js           # 云函数入口
│   ├── app.js             # Express 应用（本地开发用）
│   ├── routes/            # 路由
│   ├── models/            # 数据模型
│   └── middleware/         # 中间件
├── cloudbaserc.json       # CloudBase 配置
└── README.md
```

## 常见问题

### Q: 注册时选择「管理员」有什么用？
A: 管理员可以管理设备、审核预约、查看统计数据。普通用户只能预约设备和查看自己的预约。

### Q: 如何修改管理员权限？
A: 在 CloudBase 控制台 → 数据库 → `users` 集合，修改用户的 `role` 字段为 `admin` 或 `user`。

### Q: 云函数部署失败怎么办？
A: 检查 `server/.env` 文件中的环境变量是否正确，确保 CloudBase 环境已开通。

### Q: 前端无法访问 API 怎么办？
A: 检查 `client/src/services/api.js` 中的 `API_URL` 是否正确指向你的后端地址。

## License

MIT
