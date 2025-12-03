const express = require('express');
const mysql = require('mysql2/promise');
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
    database: 'campus_car_share',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  const userId = parseInt(token, 10);
  return Number.isNaN(userId) ? null : userId;
}

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 获取已审核车辆（可租用的车辆）
app.get('/api/vehicles', async (req, res) => {
    const [rows] = await pool.query(`
        SELECT v.*, u.name as owner_name, u.phone as owner_phone
        FROM vehicles v 
        JOIN users u ON v.owner_id = u.user_id 
        WHERE v.is_verified = 1 AND v.status = 'listed'
    `);
    res.json(rows);
});

// 登录
app.post('/api/login', async (req, res) => {
    const { student_id, password } = req.body;
    
    console.log('登录请求:', { student_id, password: '***' });
    
    try {
        const [rows] = await pool.query('SELECT user_id, student_id, name, role FROM users WHERE student_id = ? AND password = ?', [student_id, password]);
        
        console.log('查询结果:', rows.length > 0 ? '找到用户' : '未找到用户');
        
        if (rows.length > 0) {
            console.log('登录成功:', rows[0]);
            res.json({ msg: '登录成功', user: rows[0] });
        } else {
            console.log('登录失败: 学号或密码错误');
            res.status(401).json({ msg: '学号或密码错误' });
        }
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ msg: '服务器错误' });
    }
});

// 注册
app.post('/api/register', async (req, res) => {
    const { student_id, name, password } = req.body;
    try {
        await pool.query('INSERT INTO users (student_id, name, password) VALUES (?, ?, ?)', [student_id, name, password]);
        res.json({ msg: '注册成功，待审核' });
    } catch (e) {
        res.status(500).json({ msg: '注册失败：' + e.message });
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

  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ msg: '请填写完整信息' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: '新密码长度至少6位' });
  }

  try {
    // 验证旧密码
    const [user] = await pool.query('SELECT password FROM users WHERE user_id = ?', [user_id]);
    
    if (user.length === 0) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    if (user[0].password !== oldPassword) {
      return res.status(400).json({ msg: '原密码错误' });
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

// 出租车辆（更新车辆为待租用状态）
app.post('/api/rent', async (req, res) => {
  const { vehicle_id, location_desc, price_per_hour, lng, lat } = req.body;
  const owner_id = getUserIdFromRequest(req);

  if (!owner_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  if (!vehicle_id || !location_desc || !price_per_hour) {
    return res.status(400).json({ msg: '请填写完整信息' });
  }

  try {
    // 验证车辆归属和审核状态
    const [vehicle] = await pool.query(
      'SELECT owner_id, is_verified, status FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].owner_id != owner_id) {
      return res.status(403).json({ msg: '无权操作此车辆' });
    }

    if (vehicle[0].is_verified != 1) {
      return res.status(400).json({ msg: '该车辆未通过审核，无法出租' });
    }

    if (vehicle[0].status === 'rented') {
      return res.status(400).json({ msg: '该车辆正在被租用中' });
    }

    // 更新车辆状态为待租用，并更新位置和价格
    await pool.query(
      `UPDATE vehicles 
       SET status = 'listed', location_desc = ?, price_per_hour = ?, lng = ?, lat = ? 
       WHERE vehicle_id = ?`,
      [location_desc, price_per_hour, lng, lat, vehicle_id]
    );

    res.json({ msg: '出租成功！车辆已上架' });
  } catch (e) {
    console.error('出租失败', e);
    res.status(500).json({ msg: '出租失败：' + e.message });
  }
});

// 创建车辆（新接口，支持描述和车牌号）
app.post('/api/vehicles', async (req, res) => {
  console.log('收到车辆注册请求:', req.body);
  console.log('Authorization头:', req.headers.authorization);
  
  const { plate_number, type, description } = req.body;
  const owner_id = getUserIdFromRequest(req);

  console.log('解析的owner_id:', owner_id);

  if (!owner_id) {
    console.log('用户未登录');
    return res.status(401).json({ msg: '请先登录' });
  }

  if (!plate_number || !type) {
    console.log('参数不完整:', { plate_number, type });
    return res.status(400).json({ msg: '请填写车牌号和车辆类型' });
  }

  try {
    // 检查用户是否被封禁
    const [user] = await pool.query(
      'SELECT is_banned, ban_until FROM users WHERE user_id = ?',
      [owner_id]
    );
    
    if (user.length > 0) {
      const now = new Date();
      if (user[0].is_banned || (user[0].ban_until && new Date(user[0].ban_until) > now)) {
        return res.status(403).json({ msg: '您已被限制上架车辆功能，请联系管理员' });
      }
    }
    
    // 插入车辆基本信息，状态默认为idle，is_verified为0（待审核）
    let query = `INSERT INTO vehicles 
      (owner_id, plate_number, type, description, status, is_verified) 
      VALUES (?, ?, ?, ?, 'idle', 0)`;
    let params = [owner_id, plate_number, type, description || null];

    console.log('执行SQL:', query);
    console.log('参数:', params);

    await pool.query(query, params);
    console.log('车辆注册成功');
    res.json({ msg: '车辆注册申请已提交，待管理员审核' });
  } catch (e) {
    console.error('注册失败详细错误:', e);
    res.status(500).json({ msg: '注册失败：' + e.message });
  }
});

// 获取我的出租（旧接口，保留兼容）
app.get('/api/my-rentals', async (req, res) => {
  const user_id = req.query.user_id;
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE owner_id = ?', [user_id]);
  res.json(rows);
});

// 获取我的车辆列表
app.get('/api/vehicles/my', async (req, res) => {
  console.log('收到获取车辆列表请求');
  console.log('Authorization头:', req.headers.authorization);
  
  const user_id = getUserIdFromRequest(req);
  const { verified_only } = req.query;

  console.log('解析的user_id:', user_id);
  console.log('verified_only参数:', verified_only);

  if (!user_id) {
    console.log('用户未登录');
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    let query = 'SELECT * FROM vehicles WHERE owner_id = ?';
    let params = [user_id];

    // 如果只要已审核通过的车辆
    if (verified_only === 'true') {
      query += ' AND is_verified = 1';
    }

    query += ' ORDER BY created_at DESC';

    console.log('执行查询SQL:', query);
    console.log('查询参数:', params);

    const [rows] = await pool.query(query, params);
    console.log('查询结果数量:', rows.length);
    res.json(rows);
  } catch (e) {
    console.error('获取车辆列表失败详细错误:', e);
    res.status(500).json({ msg: '获取失败：' + e.message });
  }
});

// 更新车辆信息（修改价格）
app.put('/api/vehicles/:id', async (req, res) => {
  const vehicle_id = req.params.id;
  const { price_per_hour } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  if (!price_per_hour || price_per_hour < 1 || price_per_hour > 50) {
    return res.status(400).json({ msg: '租金需在1-50元之间' });
  }

  try {
    // 验证权限
    const [vehicle] = await pool.query(
      'SELECT owner_id FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权修改此车辆' });
    }

    // 更新价格
    await pool.query(
      'UPDATE vehicles SET price_per_hour = ? WHERE vehicle_id = ?',
      [price_per_hour, vehicle_id]
    );

    res.json({ msg: '更新成功' });
  } catch (e) {
    console.error('更新车辆失败', e);
    res.status(500).json({ msg: '更新失败：' + e.message });
  }
});

// 删除车辆
app.delete('/api/vehicles/:id', async (req, res) => {
  const vehicle_id = req.params.id;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证权限
    const [vehicle] = await pool.query(
      'SELECT owner_id FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权删除此车辆' });
    }

    // 检查是否有进行中的订单
    const [orders] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE vehicle_id = ? AND status IN ("pending", "confirmed")',
      [vehicle_id]
    );

    if (orders[0].count > 0) {
      return res.status(400).json({ msg: '该车辆有进行中的订单，无法删除' });
    }

    // 删除车辆
    await pool.query('DELETE FROM vehicles WHERE vehicle_id = ?', [vehicle_id]);

    res.json({ msg: '删除成功' });
  } catch (e) {
    console.error('删除车辆失败', e);
    res.status(500).json({ msg: '删除失败：' + e.message });
  }
});

// 下架车辆（将listed改为idle）
app.post('/api/vehicles/:id/unlist', async (req, res) => {
  const vehicle_id = req.params.id;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证权限
    const [vehicle] = await pool.query(
      'SELECT owner_id, status FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权操作此车辆' });
    }

    if (vehicle[0].status !== 'listed') {
      return res.status(400).json({ msg: '只能下架已上架的车辆' });
    }

    // 检查是否有进行中的订单
    const [orders] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE vehicle_id = ? AND status IN ("pending", "confirmed")',
      [vehicle_id]
    );

    if (orders[0].count > 0) {
      return res.status(400).json({ msg: '该车辆有进行中的订单，无法下架' });
    }

    // 下架车辆
    await pool.query(
      'UPDATE vehicles SET status = "idle" WHERE vehicle_id = ?',
      [vehicle_id]
    );

    res.json({ msg: '车辆已下架' });
  } catch (e) {
    console.error('下架失败', e);
    res.status(500).json({ msg: '下架失败：' + e.message });
  }
});

// 更新车辆默认备注
app.put('/api/vehicles/:id/remark', async (req, res) => {
  const vehicle_id = req.params.id;
  const { description } = req.body;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证权限
    const [vehicle] = await pool.query(
      'SELECT owner_id FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权修改此车辆' });
    }

    // 更新描述
    await pool.query(
      'UPDATE vehicles SET description = ? WHERE vehicle_id = ?',
      [description || null, vehicle_id]
    );

    res.json({ msg: '默认备注保存成功' });
  } catch (e) {
    console.error('更新备注失败', e);
    res.status(500).json({ msg: '保存失败：' + e.message });
  }
});

// 重新申请审核
app.post('/api/vehicles/:id/reapply', async (req, res) => {
  const vehicle_id = req.params.id;
  const user_id = getUserIdFromRequest(req);

  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证权限
    const [vehicle] = await pool.query(
      'SELECT owner_id, is_verified FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权操作此车辆' });
    }

    if (vehicle[0].is_verified != 2) {
      return res.status(400).json({ msg: '只有被拒绝的车辆可以重新申请' });
    }

    // 将状态改为待审核
    await pool.query(
      'UPDATE vehicles SET is_verified = 0 WHERE vehicle_id = ?',
      [vehicle_id]
    );

    res.json({ msg: '已重新提交审核' });
  } catch (e) {
    console.error('重新申请失败', e);
    res.status(500).json({ msg: '操作失败：' + e.message });
  }
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
      SELECT p.*, u.name as author_name, u.student_id as author_student_id,
             (SELECT COUNT(*) FROM post_accepts pa 
              WHERE pa.post_id = p.post_id 
              AND pa.status IN ('pending', 'accepted')) as has_active_accept
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_verified = 1 AND p.status = 'open'
    `;
    const params = [];
    
    if (type && type !== 'all') {
      if (type === 'express') {
        query += ' AND p.type = ?';
        params.push('daigou_express');
      } else if (type === 'takeaway') {
        query += ' AND p.type = ?';
        params.push('daigou_food');
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
    // 检查用户是否被封禁
    const [user] = await pool.query(
      'SELECT is_banned, ban_until FROM users WHERE user_id = ?',
      [user_id]
    );
    
    if (user.length > 0) {
      const now = new Date();
      if (user[0].is_banned || (user[0].ban_until && new Date(user[0].ban_until) > now)) {
        return res.status(403).json({ msg: '您已被限制发布帖子功能，请联系管理员' });
      }
    }
    
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

  if (!vehicle_id || !hours) {
    return res.status(400).json({ msg: '请填写完整信息' });
  }

  if (hours < 1 || hours > 72) {
    return res.status(400).json({ msg: '租用时长需在1-72小时之间' });
  }

  try {
    // 获取车辆信息
    const [vehicle] = await pool.query(
      'SELECT owner_id, price_per_hour, is_verified, status FROM vehicles WHERE vehicle_id = ?',
      [vehicle_id]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({ msg: '车辆不存在' });
    }

    if (vehicle[0].is_verified !== 1) {
      return res.status(400).json({ msg: '该车辆未通过审核' });
    }

    if (vehicle[0].status !== 'listed') {
      return res.status(400).json({ msg: '该车辆未上架或已被租用' });
    }

    if (vehicle[0].owner_id == renter_id) {
      return res.status(400).json({ msg: '不能租用自己的车辆' });
    }

    // 检查是否已有进行中的订单
    const [existingOrders] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE vehicle_id = ? AND status IN ("pending", "confirmed")',
      [vehicle_id]
    );

    if (existingOrders[0].count > 0) {
      return res.status(400).json({ msg: '该车辆已被租用' });
    }

    const total_fee = vehicle[0].price_per_hour * hours;

    // 创建订单
    await pool.query(
      `INSERT INTO orders (vehicle_id, renter_id, owner_id, hours, total_fee, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [vehicle_id, renter_id, vehicle[0].owner_id, hours, total_fee]
    );

    res.json({ msg: '订单创建成功，等待车主确认' });
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
        WHERE o.renter_id = ? AND o.status IN ('pending', 'confirmed', 'waiting_owner_confirm', 'waiting_renter_confirm')
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
        WHERE o.owner_id = ? AND o.status IN ('pending', 'confirmed', 'waiting_owner_confirm', 'waiting_renter_confirm')
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
    // 验证订单归属
    const [order] = await pool.query(
      'SELECT owner_id, vehicle_id, status FROM orders WHERE order_id = ?',
      [order_id]
    );

    if (order.length === 0) {
      return res.status(404).json({ msg: '订单不存在' });
    }

    if (order[0].owner_id != user_id) {
      return res.status(403).json({ msg: '无权操作此订单' });
    }

    if (order[0].status !== 'pending') {
      return res.status(400).json({ msg: '订单状态不正确' });
    }

    // 确认订单并更新车辆状态为rented
    await pool.query(
      'UPDATE orders SET status = "confirmed" WHERE order_id = ?',
      [order_id]
    );

    await pool.query(
      'UPDATE vehicles SET status = "rented" WHERE vehicle_id = ?',
      [order[0].vehicle_id]
    );

    res.json({ msg: '订单确认成功，车辆已出租' });
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
    // 验证订单归属（车主或租用者都可以完成）
    const [order] = await pool.query(
      'SELECT owner_id, renter_id, vehicle_id, status FROM orders WHERE order_id = ?',
      [order_id]
    );

    if (order.length === 0) {
      return res.status(404).json({ msg: '订单不存在' });
    }

    if (order[0].owner_id != user_id && order[0].renter_id != user_id) {
      return res.status(403).json({ msg: '无权操作此订单' });
    }

    const isOwner = order[0].owner_id == user_id;
    const isRenter = order[0].renter_id == user_id;
    const currentStatus = order[0].status;

    // 根据当前状态和用户身份决定下一步操作
    if (currentStatus === 'confirmed') {
      // 订单已确认，第一方点击完成
      let newStatus;
      let message;
      
      if (isRenter) {
        // 租客点击完成，等待车主确认
        newStatus = 'waiting_owner_confirm';
        message = '已提交完成请求，等待车主确认';
      } else {
        // 车主点击完成，等待租客确认
        newStatus = 'waiting_renter_confirm';
        message = '已提交完成请求，等待租客确认';
      }
      
      await pool.query(
        'UPDATE orders SET status = ? WHERE order_id = ?',
        [newStatus, order_id]
      );
      
      res.json({ msg: message, status: newStatus });
    } else if (currentStatus === 'waiting_owner_confirm' && isOwner) {
      // 车主确认租客的完成请求
      await pool.query(
        'UPDATE orders SET status = "completed", completed_at = NOW() WHERE order_id = ?',
        [order_id]
      );
      
      await pool.query(
        'UPDATE vehicles SET status = "idle" WHERE vehicle_id = ?',
        [order[0].vehicle_id]
      );
      
      res.json({ msg: '订单已完成，车辆已归还', status: 'completed' });
    } else if (currentStatus === 'waiting_renter_confirm' && isRenter) {
      // 租客确认车主的完成请求
      await pool.query(
        'UPDATE orders SET status = "completed", completed_at = NOW() WHERE order_id = ?',
        [order_id]
      );
      
      await pool.query(
        'UPDATE vehicles SET status = "idle" WHERE vehicle_id = ?',
        [order[0].vehicle_id]
      );
      
      res.json({ msg: '订单已完成，车辆已归还', status: 'completed' });
    } else {
      return res.status(400).json({ msg: '订单状态不正确或无权限操作' });
    }
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
      'SELECT owner_id, renter_id, vehicle_id, status FROM orders WHERE order_id = ?',
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

    // 取消订单并恢复车辆状态
    await pool.query('UPDATE orders SET status = "cancelled" WHERE order_id = ?', [order_id]);
    
    // 如果订单已确认，需要恢复车辆状态为idle
    if (order[0].status === 'confirmed') {
      await pool.query('UPDATE vehicles SET status = "idle" WHERE vehicle_id = ?', [order[0].vehicle_id]);
    }
    
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
    
    // 同时更新帖子状态为已完成
    await pool.query(
      'UPDATE posts SET status = "completed" WHERE post_id = ?',
      [accept[0].post_id]
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

// ==================== 举报与安全系统 API ====================

// 根据学号查询用户（用于举报时查找用户）
app.get('/api/users', async (req, res) => {
  const { student_id } = req.query;
  
  if (!student_id) {
    return res.status(400).json({ msg: '请提供学号' });
  }

  try {
    const [users] = await pool.query(
      'SELECT user_id, name, student_id FROM users WHERE student_id = ?',
      [student_id]
    );
    res.json(users);
  } catch (e) {
    console.error('查询用户失败', e);
    res.status(500).json({ msg: '查询用户失败：' + e.message });
  }
});

// 提交举报
app.post('/api/reports', async (req, res) => {
  const { reported_id, report_type, related_id, reason, description, evidence_urls } = req.body;
  const reporter_id = getUserIdFromRequest(req);

  if (!reporter_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  if (reporter_id == reported_id) {
    return res.status(400).json({ msg: '不能举报自己' });
  }

  try {
    const evidence_json = evidence_urls ? JSON.stringify(evidence_urls) : null;
    
    await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, report_type, related_id, reason, description, evidence_urls) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reporter_id, reported_id, report_type, related_id, reason, description, evidence_json]
    );
    
    res.json({ msg: '举报提交成功，等待管理员审核' });
  } catch (e) {
    console.error('提交举报失败', e);
    res.status(500).json({ msg: '提交举报失败：' + e.message });
  }
});

// 获取我的举报列表
app.get('/api/reports/my', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as reported_name, u.student_id as reported_student_id
       FROM reports r
       JOIN users u ON r.reported_id = u.user_id
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (e) {
    console.error('获取举报列表失败', e);
    res.status(500).json({ msg: '获取举报列表失败：' + e.message });
  }
});

// 管理员获取待审核举报列表
app.get('/api/admin/reports/pending', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证管理员权限
    const [user] = await pool.query('SELECT role FROM users WHERE user_id = ?', [user_id]);
    if (user.length === 0 || user[0].role !== 'admin') {
      return res.status(403).json({ msg: '无权限访问' });
    }

    const [rows] = await pool.query(
      `SELECT r.*, 
              reporter.name as reporter_name, reporter.student_id as reporter_student_id, reporter.phone as reporter_phone,
              reported.name as reported_name, reported.student_id as reported_student_id, reported.phone as reported_phone,
              reported.report_count, reported.blackroom_count, reported.is_banned
       FROM reports r
       JOIN users reporter ON r.reporter_id = reporter.user_id
       JOIN users reported ON r.reported_id = reported.user_id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('获取待审核举报失败', e);
    res.status(500).json({ msg: '获取待审核举报失败：' + e.message });
  }
});

// 管理员审核举报
app.post('/api/admin/reports/review', async (req, res) => {
  const { report_id, action, admin_note } = req.body; // action: 'approve' or 'reject'
  const admin_id = getUserIdFromRequest(req);

  if (!admin_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    // 验证管理员权限
    const [admin] = await pool.query('SELECT role FROM users WHERE user_id = ?', [admin_id]);
    if (admin.length === 0 || admin[0].role !== 'admin') {
      return res.status(403).json({ msg: '无权限操作' });
    }

    // 获取举报信息
    const [report] = await pool.query('SELECT * FROM reports WHERE report_id = ?', [report_id]);
    if (report.length === 0) {
      return res.status(404).json({ msg: '举报不存在' });
    }

    if (report[0].status !== 'pending') {
      return res.status(400).json({ msg: '该举报已被处理' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      // 更新举报状态
      await connection.query(
        'UPDATE reports SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE report_id = ?',
        [status, admin_note, admin_id, report_id]
      );

      // 如果审核通过，增加被举报人的举报次数
      if (action === 'approve') {
        await connection.query(
          'UPDATE users SET report_count = report_count + 1 WHERE user_id = ?',
          [report[0].reported_id]
        );

        // 检查是否达到5次举报，需要进入小黑屋
        const [user] = await connection.query(
          'SELECT report_count, blackroom_count FROM users WHERE user_id = ?',
          [report[0].reported_id]
        );

        if (user[0].report_count >= 5) {
          const blackroomCount = user[0].blackroom_count + 1;
          const isPermanent = blackroomCount >= 3;
          const releaseTime = isPermanent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后

          // 插入小黑屋记录
          await connection.query(
            `INSERT INTO blackroom_records (user_id, enter_count, reason, release_time, is_permanent)
             VALUES (?, ?, ?, ?, ?)`,
            [report[0].reported_id, blackroomCount, '累计被举报5次', releaseTime, isPermanent]
          );

          // 更新用户状态
          await connection.query(
            'UPDATE users SET blackroom_count = ?, is_banned = ?, ban_until = ?, report_count = 0 WHERE user_id = ?',
            [blackroomCount, isPermanent ? 1 : 0, releaseTime, report[0].reported_id]
          );
        }
      }

      await connection.commit();
      res.json({ 
        msg: action === 'approve' ? '举报审核通过' : '举报已驳回',
        entered_blackroom: action === 'approve' && report[0].report_count >= 4 // 原来4次，加1变5次
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (e) {
    console.error('审核举报失败', e);
    res.status(500).json({ msg: '审核举报失败：' + e.message });
  }
});

// 获取黑名单列表
app.get('/api/blacklist', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT 
              u.user_id,
              u.name,
              u.student_id,
              u.report_count,
              u.blackroom_count,
              u.is_banned,
              u.ban_until,
              COUNT(DISTINCT r.report_id) as approved_report_count
       FROM users u
       INNER JOIN reports r ON u.user_id = r.reported_id AND r.status = 'approved'
       GROUP BY u.user_id
       ORDER BY u.report_count DESC, u.blackroom_count DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('获取黑名单失败', e);
    res.status(500).json({ msg: '获取黑名单失败：' + e.message });
  }
});

// 获取小黑屋列表
app.get('/api/blackroom', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT br.*, u.name, u.student_id, u.is_banned
       FROM blackroom_records br
       JOIN users u ON br.user_id = u.user_id
       ORDER BY br.enter_time DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('获取小黑屋列表失败', e);
    res.status(500).json({ msg: '获取小黑屋列表失败：' + e.message });
  }
});

// 检查用户是否被封禁
app.get('/api/user/ban-status', async (req, res) => {
  const user_id = getUserIdFromRequest(req);
  
  if (!user_id) {
    return res.status(401).json({ msg: '请先登录' });
  }

  try {
    const [user] = await pool.query(
      'SELECT is_banned, ban_until, blackroom_count FROM users WHERE user_id = ?',
      [user_id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    const now = new Date();
    let isBanned = false;
    let reason = '';

    if (user[0].is_banned) {
      isBanned = true;
      reason = '永久封禁';
    } else if (user[0].ban_until && new Date(user[0].ban_until) > now) {
      isBanned = true;
      reason = `临时封禁至 ${new Date(user[0].ban_until).toLocaleString('zh-CN')}`;
    }

    res.json({
      is_banned: isBanned,
      reason: reason,
      ban_until: user[0].ban_until,
      blackroom_count: user[0].blackroom_count
    });
  } catch (e) {
    console.error('检查封禁状态失败', e);
    res.status(500).json({ msg: '检查封禁状态失败：' + e.message });
  }
});

app.listen(3000, () => {
    console.log('后端运行：http://localhost:3000');
});