const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 数据库
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'mysql102322',
    database: 'campus_car_share'
}).promise();

// 认证中间件
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    req.currentUser = { user_id: auth.split(' ')[1] };
  }
  next();
});

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 获取已审核车辆
app.get('/api/vehicles', async (req, res) => {
    const [rows] = await pool.query(`
        SELECT v.*, u.name as owner_name 
        FROM vehicles v 
        JOIN users u ON v.owner_id = u.user_id 
        WHERE v.is_verified = 1
    `);
    res.json(rows);
});

// 登录
app.post('/api/login', async (req, res) => {
    const { student_id, password } = req.body;
    const [rows] = await pool.query('SELECT user_id, student_id, name, role FROM users WHERE student_id = ? AND password = ?', [student_id, password]);
    if (rows.length > 0) {
        res.json({ msg: '登录成功', user: rows[0] });
    } else {
        res.status(401).json({ msg: '学号或密码错误' });
    }
});

// 注册
app.post('/api/register', async (req, res) => {
    const { student_id, name, password } = req.body;
    try {
        await pool.query('INSERT INTO users (student_id, name, password) VALUES (?, ?, ?)', [student_id, name, password]);
        res.json({ msg: '注册成功，待审核' });
    } catch (e) {
        res.status(400).json({ msg: '学号已存在' });
    }
});

// 管理员待审核
app.get('/api/admin/pending', async (req, res) => {
    const [users] = await pool.query('SELECT user_id, student_id, name FROM users WHERE is_verified = 0');
    const [vehicles] = await pool.query('SELECT vehicle_id, type, location_desc FROM vehicles WHERE is_verified = 0');
    const [posts] = await pool.query('SELECT post_id, title, pickup_location, deliver_location FROM posts WHERE is_verified = 0');
    res.json({ users, vehicles, posts });
});

// 管理员审核通过
app.post('/api/admin/approve', async (req, res) => {
    const { type, id } = req.body;
    try {
        if (type === 'user') await pool.query('UPDATE users SET is_verified = 1 WHERE user_id = ?', [id]);
        if (type === 'vehicle') await pool.query('UPDATE vehicles SET is_verified = 1 WHERE vehicle_id = ?', [id]);
        if (type === 'post') await pool.query('UPDATE posts SET is_verified = 1 WHERE post_id = ?', [id]);
        res.json({ msg: '审核通过' });
    } catch (e) {
        res.status(500).json({ msg: '审核失败' });
    }
});

// 出租车辆
app.post('/api/rent', async (req, res) => {
  const { type, price_per_hour, location_desc, lng, lat } = req.body;
  const owner_id = parseInt(req.headers.authorization?.split(' ')[1], 10);

  if (!owner_id || isNaN(owner_id)) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    await pool.query(
      `INSERT INTO vehicles 
       (owner_id, type, location_desc, price_per_hour, is_verified, lng, lat) 
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [owner_id, type, location_desc, price_per_hour, lng, lat]
    );
    res.json({ msg: '出租成功，待管理员审核' });
  } catch (e) {
    console.error('出租失败', e);
    res.status(500).json({ msg: '出租失败：' + e.message });
  }
});

// 获取我的出租
app.get('/api/my-rentals', async (req, res) => {
  const user_id = req.query.user_id;
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE owner_id = ?', [user_id]);
  res.json(rows);
});

// 撤回车辆
app.post('/api/withdraw', async (req, res) => {
  const { vehicle_id } = req.body;
  const user_id = req.headers.authorization?.split(' ')[1];

  try {
    const [rows] = await pool.query('SELECT owner_id FROM vehicles WHERE vehicle_id = ?', [vehicle_id]);
    if (rows.length === 0 || rows[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }
    await pool.query('UPDATE vehicles SET is_verified = -1 WHERE vehicle_id = ?', [vehicle_id]);
    res.json({ msg: '撤回成功' });
  } catch (e) {
    res.status(500).json({ msg: '撤回失败' });
  }
});

// 彻底删除车辆记录
app.post('/api/delete-vehicle', async (req, res) => {
  const { vehicle_id } = req.body;
  const user_id = req.headers.authorization?.split(' ')[1];

  try {
    const [rows] = await pool.query('SELECT owner_id, is_verified FROM vehicles WHERE vehicle_id = ?', [vehicle_id]);
    if (rows.length === 0 || rows[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }
    if (rows[0].is_verified !== -1) {
      return res.status(400).json({ msg: '只能删除已撤回的记录' });
    }

    await pool.query('DELETE FROM vehicles WHERE vehicle_id = ?', [vehicle_id]);
    res.json({ msg: '记录已删除' });
  } catch (e) {
    res.status(500).json({ msg: '删除失败' });
  }
});

app.listen(3000, () => {
    console.log('后端运行：http://localhost:3000');
});