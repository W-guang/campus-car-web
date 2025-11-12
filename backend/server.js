const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'mysql102322', // 改成你的密码
    database: 'campus_car_share'
}).promise();

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 获取车辆列表
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
    const [rows] = await pool.query('SELECT * FROM users WHERE student_id = ? AND password = ?', [student_id, password]);
    if (rows.length > 0) {
        res.json({ code: 0, msg: '登录成功', user: rows[0] });
    } else {
        res.status(401).json({ code: 1, msg: '学号或密码错误' });
    }
});

// 注册
app.post('/api/register', async (req, res) => {
    const { student_id, name, password } = req.body;
    try {
        await pool.query('INSERT INTO users (student_id, name, password) VALUES (?, ?, ?)', [student_id, name, password]);
        res.json({ code: 0, msg: '注册成功，待审核' });
    } catch (e) {
        res.status(400).json({ code: 1, msg: '学号已存在' });
    }
});

// 发布代拿
app.post('/api/posts', async (req, res) => {
    const { type, pickup_location, deliver_location, reward } = req.body;
    await pool.query(`
        INSERT INTO posts (user_id, title, type, reward, pickup_location, deliver_location) 
        VALUES (2, ?, ?, ?, ?, ?)
    `, [`${type === 'daigou_express' ? '代拿快递' : '代拿外卖'}任务`, type, reward, pickup_location, deliver_location]);
    res.json({ msg: '发布成功，待审核' });
});

// 管理员：获取待审核
app.get('/api/admin/pending', async (req, res) => {
    const [users] = await pool.query('SELECT user_id, student_id, name FROM users WHERE is_verified = 0');
    const [vehicles] = await pool.query('SELECT vehicle_id, type, location_desc FROM vehicles WHERE is_verified = 0');
    const [posts] = await pool.query('SELECT post_id, title, type FROM posts WHERE is_verified = 0');
    res.json({ users, vehicles, posts });
});

app.listen(3000, () => {
    console.log('后端运行：http://localhost:3000');
    console.log('首页：http://localhost:3000');
    console.log('登录：http://localhost:3000/login.html');
});
