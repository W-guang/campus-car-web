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

function getUserIdFromRequest(req) {
  const token = req.headers.authorization?.split(' ')[1];
  const userId = parseInt(token, 10);
  return Number.isNaN(userId) ? null : userId;
}

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

// 获取个人资料
app.get('/api/profile', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT user_id, student_id, name, phone, role, is_verified, status FROM users WHERE user_id = ?',
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error('获取个人资料失败', e);
    res.status(500).json({ msg: '获取个人资料失败' });
  }
});

// 更新个人资料
app.put('/api/profile', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  const { name, phone } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ msg: '姓名不能为空' });
  }

  if (!/^1[3-9]\d{9}$/.test(phone || '')) {
    return res.status(400).json({ msg: '请输入正确的11位手机号' });
  }

  try {
    await pool.query('UPDATE users SET name = ?, phone = ? WHERE user_id = ?', [name.trim(), phone.trim(), user_id]);
    const [rows] = await pool.query(
      'SELECT user_id, student_id, name, phone, role, is_verified, status FROM users WHERE user_id = ?',
      [user_id]
    );
    res.json({ msg: '个人信息更新成功', user: rows[0] });
  } catch (e) {
    console.error('更新个人资料失败', e);
    res.status(500).json({ msg: '更新个人资料失败' });
  }
});

// 修改密码
app.put('/api/change-password', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  const { currentPassword, newPassword } = req.body;

  // 参数验证
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: '请填写所有密码字段' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: '新密码长度至少6位' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ msg: '新密码不能与当前密码相同' });
  }

  try {
    // 查询当前用户的密码
    const [rows] = await pool.query('SELECT password FROM users WHERE user_id = ?', [user_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    const user = rows[0];

    // 验证当前密码是否正确（这里简单对比，实际应用应使用bcrypt）
    if (user.password !== currentPassword) {
      return res.status(400).json({ msg: '当前密码不正确' });
    }

    // 更新密码
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [newPassword, user_id]);
    
    res.json({ msg: '密码修改成功' });
  } catch (e) {
    console.error('修改密码失败', e);
    res.status(500).json({ msg: '修改密码失败：' + e.message });
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

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  try {
    // 当前可租车辆数（已审核且未撤回）
    const [carCount] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE is_verified = 1');
    
    // 今日租车订单数（如果orders表存在）
    const today = new Date().toISOString().split('T')[0];
    let todayOrderCount = 0;
    try {
      const [orderCount] = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?',
        [today]
      );
      todayOrderCount = orderCount[0]?.count || 0;
    } catch (e) {
      // orders表可能不存在，忽略错误
      console.log('orders表不存在或查询失败，使用默认值0');
    }
    
    // 今日新发布车辆数（检查created_at字段是否存在）
    let todayVehicleCount = 0;
    try {
      const [todayVehicleCountResult] = await pool.query(
        'SELECT COUNT(*) as count FROM vehicles WHERE DATE(created_at) = ?',
        [today]
      );
      todayVehicleCount = todayVehicleCountResult[0]?.count || 0;
    } catch (e) {
      // created_at字段可能不存在，使用默认值0
      console.log('created_at字段不存在或查询失败，使用默认值0');
    }
    
    res.json({
      carCount: carCount[0]?.count || 0,
      todayOrderCount: todayOrderCount,
      todayVehicleCount: todayVehicleCount
    });
  } catch (e) {
    console.error('获取统计数据失败', e);
    res.status(500).json({ msg: '获取统计数据失败' });
  }
});

// 获取论坛帖子（已审核）
app.get('/api/posts', async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT p.*, u.name as author_name, u.student_id as author_student_id
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_verified = 1
    `;
    const params = [];
    
    if (type && type !== 'all') {
      if (type === 'express') {
        query += ' AND p.type = ?';
        params.push('daigou_express');
      } else if (type === 'takeaway') {
        query += ' AND p.type = ?';
        params.push('daigou_food');
      } else if (type === 'carShare') {
        query += ' AND p.type = ? AND p.route IS NOT NULL';
        params.push('share');
      } else if (type === 'experience') {
        query += ' AND p.type = ? AND p.route IS NULL';
        params.push('share');
      }
    }
    
    query += ' ORDER BY p.post_id DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error('获取帖子失败', e);
    res.status(500).json({ msg: '获取帖子失败' });
  }
});

// 发布帖子
app.post('/api/posts', async (req, res) => {
  const { type, title, content, reward, pickup_location, deliver_location, deadline, route, share_time, share_person, remark } = req.body;
  const user_id = parseInt(req.headers.authorization?.split(' ')[1], 10);

  if (!user_id || isNaN(user_id)) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    await pool.query(
      `INSERT INTO posts (user_id, type, title, content, reward, pickup_location, deliver_location, deadline, route, share_time, share_person, remark, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [user_id, type, title, content, reward || 0, pickup_location, deliver_location, deadline, route, share_time, share_person, remark]
    );
    res.json({ msg: '发布成功，待管理员审核' });
  } catch (e) {
    console.error('发布帖子失败', e);
    res.status(500).json({ msg: '发布帖子失败：' + e.message });
  }
});

// 删除帖子
app.delete('/api/posts/:post_id', async (req, res) => {
  const { post_id } = req.params;
  const user_id = getUserIdFromRequest(req);
  
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证帖子是否存在且属于当前用户
    const [rows] = await pool.query(
      'SELECT user_id FROM posts WHERE post_id = ?',
      [post_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: '帖子不存在' });
    }

    if (rows[0].user_id !== user_id) {
      return res.status(403).json({ msg: '无权删除此帖子' });
    }

    // 删除帖子（数据库外键配置为CASCADE，会自动删除相关接单记录）
    await pool.query('DELETE FROM posts WHERE post_id = ?', [post_id]);
    
    res.json({ msg: '帖子已删除' });
  } catch (e) {
    console.error('删除帖子失败', e);
    res.status(500).json({ msg: '删除帖子失败：' + e.message });
  }
});

// 接单功能
app.post('/api/posts/accept', async (req, res) => {
  const { post_id } = req.body;
  const accepter_id = parseInt(req.headers.authorization?.split(' ')[1], 10);

  if (!accepter_id || isNaN(accepter_id)) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 检查是否已经接单
    const [existing] = await pool.query(
      'SELECT * FROM post_accepts WHERE post_id = ? AND accepter_id = ? AND status IN ("pending", "accepted")',
      [post_id, accepter_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ msg: '您已经接单了' });
    }

    // 检查帖子是否存在
    const [post] = await pool.query('SELECT * FROM posts WHERE post_id = ?', [post_id]);
    if (post.length === 0) {
      return res.status(404).json({ msg: '帖子不存在' });
    }

    // 创建接单记录
    await pool.query(
      'INSERT INTO post_accepts (post_id, accepter_id, status) VALUES (?, ?, "pending")',
      [post_id, accepter_id]
    );
    res.json({ msg: '接单成功，等待发布者确认' });
  } catch (e) {
    console.error('接单失败', e);
    res.status(500).json({ msg: '接单失败：' + e.message });
  }
});

// 确认接单（发布者确认）
app.post('/api/posts/confirm-accept', async (req, res) => {
  const { accept_id } = req.body;
  const user_id = parseInt(req.headers.authorization?.split(' ')[1], 10);

  if (!user_id || isNaN(user_id)) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 检查权限
    const [accept] = await pool.query(
      `SELECT pa.*, p.user_id as post_owner_id 
       FROM post_accepts pa 
       JOIN posts p ON pa.post_id = p.post_id 
       WHERE pa.accept_id = ?`,
      [accept_id]
    );
    
    if (accept.length === 0) {
      return res.status(404).json({ msg: '接单记录不存在' });
    }
    
    if (accept[0].post_owner_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    // 更新接单状态
    await pool.query(
      'UPDATE post_accepts SET status = "accepted" WHERE accept_id = ?',
      [accept_id]
    );
    res.json({ msg: '确认接单成功' });
  } catch (e) {
    console.error('确认接单失败', e);
    res.status(500).json({ msg: '确认接单失败：' + e.message });
  }
});

// 获取我的接单/发布的帖子
app.get('/api/posts/my', async (req, res) => {
  const user_id = parseInt(req.query.user_id, 10);
  const { type } = req.query; // 'published' 或 'accepted'

  if (!user_id || isNaN(user_id)) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    if (type === 'published') {
      // 我发布的帖子
      const [rows] = await pool.query(
        `SELECT p.*, 
         (SELECT COUNT(*) FROM post_accepts WHERE post_id = p.post_id AND status IN ('pending', 'accepted')) as accept_count
         FROM posts p 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC`,
        [user_id]
      );
      res.json(rows);
    } else if (type === 'accepted') {
      // 我接单的帖子
      const [rows] = await pool.query(
        `SELECT p.*, pa.accept_id, pa.status as accept_status, pa.voucher_url, pa.created_at as accept_time
         FROM post_accepts pa
         JOIN posts p ON pa.post_id = p.post_id
         WHERE pa.accepter_id = ?
         ORDER BY pa.created_at DESC`,
        [user_id]
      );
      res.json(rows);
    } else {
      res.status(400).json({ msg: '参数错误' });
    }
  } catch (e) {
    console.error('获取我的帖子失败', e);
    res.status(500).json({ msg: '获取失败：' + e.message });
  }
});

// 添加管理员（仅管理员可操作）
app.post('/api/admin/add-admin', async (req, res) => {
  const { student_id, name, password, phone } = req.body;
  const admin_id = getUserIdFromRequest(req);

  if (!admin_id || isNaN(admin_id)) {
    return res.status(401).json({ msg: '请先登录' });
  }

  const studentIdPattern = /^\d{8,12}$/;
  if (!studentIdPattern.test(student_id || '')) {
    return res.status(400).json({ msg: '学号格式不正确，应为8-12位数字' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ msg: '姓名不能为空' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ msg: '密码至少6位' });
  }

  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ msg: '请输入正确的11位手机号' });
  }

  try {
    // 检查当前用户是否为管理员
    const [admin] = await pool.query('SELECT role FROM users WHERE user_id = ?', [admin_id]);
    if (admin.length === 0 || admin[0].role !== 'admin') {
      return res.status(403).json({ msg: '无权限，仅管理员可操作' });
    }

    // 检查学号是否已存在
    const [existing] = await pool.query('SELECT user_id FROM users WHERE student_id = ?', [student_id]);
    if (existing.length > 0) {
      return res.status(400).json({ msg: '学号已存在' });
    }

    // 创建管理员账号
    await pool.query(
      'INSERT INTO users (student_id, name, password, phone, role, is_verified) VALUES (?, ?, ?, ?, "admin", 1)',
      [student_id, name, password, phone]
    );
    res.json({ msg: '管理员账号创建成功' });
  } catch (e) {
    console.error('添加管理员失败', e);
    res.status(500).json({ msg: '添加管理员失败：' + e.message });
  }
});

// 创建租车订单
app.post('/api/orders', async (req, res) => {
  const { vehicle_id, hours } = req.body;
  const renter_id = getUserIdFromRequest(req);

  if (!renter_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  if (!vehicle_id || !hours || hours <= 0) {
    return res.status(400).json({ msg: '参数错误' });
  }

  try {
    // 获取车辆信息
    const [vehicle] = await pool.query(
      'SELECT owner_id, price_per_hour, is_verified FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].is_verified !== 1) {
      return res.status(400).json({ msg: '车辆未通过审核' });
    }

    if (vehicle[0].owner_id == renter_id) {
      return res.status(400).json({ msg: '不能租用自己的车辆' });
    }

    const total_fee = (vehicle[0].price_per_hour * hours).toFixed(2);

    // 创建订单
    const [result] = await pool.query(
      'INSERT INTO orders (vehicle_id, renter_id, owner_id, hours, total_fee, status) VALUES (?, ?, ?, ?, ?, "pending")',
      [vehicle_id, renter_id, vehicle[0].owner_id, hours, total_fee]
    );

    // 获取车主信息
    const [owner] = await pool.query(
      'SELECT name, phone FROM users WHERE user_id = ?',
      [vehicle[0].owner_id]
    );

    res.json({ 
      msg: '订单创建成功', 
      order_id: result.insertId,
      total_fee,
      owner_info: {
        name: owner[0].name,
        phone: owner[0].phone
      }
    });
  } catch (e) {
    console.error('创建订单失败', e);
    res.status(500).json({ msg: '创建订单失败：' + e.message });
  }
});

// 获取我的租车订单
app.get('/api/orders/my', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  const { type } = req.query; // 'rented'、'owned' 或 'history'

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    let query = '';
    let params = [];

    if (type === 'rented') {
      // 我租的车（进行中的订单）
      query = `
        SELECT o.*, v.type as vehicle_type, v.location_desc, u.name as owner_name, u.phone as owner_phone
        FROM orders o
        JOIN vehicles v ON o.vehicle_id = v.vehicle_id
        JOIN users u ON o.owner_id = u.user_id
        WHERE o.renter_id = ? AND o.status IN ('pending', 'confirmed')
        ORDER BY o.created_at DESC
      `;
      params = [user_id];
    } else if (type === 'owned') {
      // 租我车的订单（进行中的订单）
      query = `
        SELECT o.*, v.type as vehicle_type, v.location_desc, u.name as renter_name, u.phone as renter_phone
        FROM orders o
        JOIN vehicles v ON o.vehicle_id = v.vehicle_id
        JOIN users u ON o.renter_id = u.user_id
        WHERE o.owner_id = ? AND o.status IN ('pending', 'confirmed')
        ORDER BY o.created_at DESC
      `;
      params = [user_id];
    } else if (type === 'history') {
      // 历史记录（已完成或已取消的订单）
      query = `
        SELECT o.*, v.type as vehicle_type, v.location_desc,
          CASE 
            WHEN o.renter_id = ? THEN u2.name
            ELSE u1.name
          END as other_name,
          CASE 
            WHEN o.renter_id = ? THEN u2.phone
            ELSE u1.phone
          END as other_phone
        FROM orders o
        JOIN vehicles v ON o.vehicle_id = v.vehicle_id
        LEFT JOIN users u1 ON o.renter_id = u1.user_id
        LEFT JOIN users u2 ON o.owner_id = u2.user_id
        WHERE (o.renter_id = ? OR o.owner_id = ?) 
          AND o.status IN ('completed', 'cancelled')
        ORDER BY o.completed_at DESC, o.created_at DESC
      `;
      params = [user_id, user_id, user_id, user_id];
    } else {
      return res.status(400).json({ msg: '参数错误' });
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error('获取订单失败', e);
    res.status(500).json({ msg: '获取订单失败：' + e.message });
  }
});

// 确认租车订单（车主确认）
app.post('/api/orders/confirm', async (req, res) => {
  const { order_id } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [order] = await pool.query('SELECT owner_id, status FROM orders WHERE order_id = ?', [order_id]);
    
    if (order.length === 0) {
      return res.status(404).json({ msg: '订单不存在' });
    }

    if (order[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    if (order[0].status !== 'pending') {
      return res.status(400).json({ msg: '订单状态不正确' });
    }

    await pool.query('UPDATE orders SET status = "confirmed" WHERE order_id = ?', [order_id]);
    res.json({ msg: '订单确认成功' });
  } catch (e) {
    console.error('确认订单失败', e);
    res.status(500).json({ msg: '确认订单失败：' + e.message });
  }
});

// 完成订单
app.post('/api/orders/complete', async (req, res) => {
  const { order_id } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [order] = await pool.query(
      'SELECT owner_id, renter_id, status FROM orders WHERE order_id = ?',
      [order_id]
    );
    
    if (order.length === 0) {
      return res.status(404).json({ msg: '订单不存在' });
    }

    // 车主或租客都可以完成订单
    if (order[0].owner_id != user_id && order[0].renter_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    if (order[0].status !== 'confirmed') {
      return res.status(400).json({ msg: '订单未确认，无法完成' });
    }

    await pool.query(
      'UPDATE orders SET status = "completed", completed_at = NOW() WHERE order_id = ?',
      [order_id]
    );
    res.json({ msg: '订单完成' });
  } catch (e) {
    console.error('完成订单失败', e);
    res.status(500).json({ msg: '完成订单失败：' + e.message });
  }
});

// 取消订单
app.post('/api/orders/cancel', async (req, res) => {
  const { order_id } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [order] = await pool.query(
      'SELECT owner_id, renter_id, status FROM orders WHERE order_id = ?',
      [order_id]
    );
    
    if (order.length === 0) {
      return res.status(404).json({ msg: '订单不存在' });
    }

    // 车主或租客都可以取消订单
    if (order[0].owner_id != user_id && order[0].renter_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    if (order[0].status === 'completed' || order[0].status === 'cancelled') {
      return res.status(400).json({ msg: '订单已完成或已取消' });
    }

    await pool.query('UPDATE orders SET status = "cancelled" WHERE order_id = ?', [order_id]);
    res.json({ msg: '订单已取消' });
  } catch (e) {
    console.error('取消订单失败', e);
    res.status(500).json({ msg: '取消订单失败：' + e.message });
  }
});

// 获取帖子的接单列表（发布者查看）
app.get('/api/posts/:post_id/accepts', async (req, res) => {
  const { post_id } = req.params;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 检查权限
    const [post] = await pool.query('SELECT user_id FROM posts WHERE post_id = ?', [post_id]);
    if (post.length === 0) {
      return res.status(404).json({ msg: '帖子不存在' });
    }

    if (post[0].user_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    // 获取接单列表
    const [accepts] = await pool.query(
      `SELECT pa.*, u.name as accepter_name, u.student_id as accepter_student_id, u.phone as accepter_phone
       FROM post_accepts pa
       JOIN users u ON pa.accepter_id = u.user_id
       WHERE pa.post_id = ?
       ORDER BY pa.created_at DESC`,
      [post_id]
    );

    res.json(accepts);
  } catch (e) {
    console.error('获取接单列表失败', e);
    res.status(500).json({ msg: '获取接单列表失败：' + e.message });
  }
});

// 完成代拿订单
app.post('/api/posts/complete-accept', async (req, res) => {
  const { accept_id } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 检查权限
    const [accept] = await pool.query(
      `SELECT pa.*, p.user_id as post_owner_id 
       FROM post_accepts pa 
       JOIN posts p ON pa.post_id = p.post_id 
       WHERE pa.accept_id = ?`,
      [accept_id]
    );
    
    if (accept.length === 0) {
      return res.status(404).json({ msg: '接单记录不存在' });
    }
    
    if (accept[0].post_owner_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    if (accept[0].status !== 'accepted') {
      return res.status(400).json({ msg: '订单状态不正确' });
    }

    // 更新接单状态
    await pool.query(
      'UPDATE post_accepts SET status = "completed", completed_at = NOW() WHERE accept_id = ?',
      [accept_id]
    );
    res.json({ msg: '订单完成' });
  } catch (e) {
    console.error('完成订单失败', e);
    res.status(500).json({ msg: '完成订单失败：' + e.message });
  }
});

// 取消接单
app.post('/api/posts/cancel-accept', async (req, res) => {
  const { accept_id } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [accept] = await pool.query(
      `SELECT pa.*, p.user_id as post_owner_id 
       FROM post_accepts pa 
       JOIN posts p ON pa.post_id = p.post_id 
       WHERE pa.accept_id = ?`,
      [accept_id]
    );
    
    if (accept.length === 0) {
      return res.status(404).json({ msg: '接单记录不存在' });
    }
    
    // 发布者或接单者都可以取消
    if (accept[0].post_owner_id != user_id && accept[0].accepter_id != user_id) {
      return res.status(403).json({ msg: '无权限' });
    }

    if (accept[0].status === 'completed' || accept[0].status === 'cancelled') {
      return res.status(400).json({ msg: '订单已完成或已取消' });
    }

    await pool.query('UPDATE post_accepts SET status = "cancelled" WHERE accept_id = ?', [accept_id]);
    res.json({ msg: '已取消接单' });
  } catch (e) {
    console.error('取消接单失败', e);
    res.status(500).json({ msg: '取消接单失败：' + e.message });
  }
});

app.listen(3000, () => {
    console.log('后端运行：http://localhost:3000');
});