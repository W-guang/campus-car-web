# API接口文档

> 前端调用后端的所有API接口说明

---

## 🌐 基础信息

**Base URL**：`http://localhost:3000`

**认证方式**：Bearer Token（通过Header传递）

```javascript
headers: {
  'Authorization': 'Bearer ' + localStorage.getItem('user_id')
}
```

---

## 📡 接口列表

### 1. 用户认证

#### 1.1 用户登录

```http
POST /api/login
```

**请求体**：
```json
{
  "student_id": "202101",
  "password": "123456"
}
```

**成功响应** (200)：
```json
{
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "student_id": "202101",
    "name": "张三",
    "role": "user",
    "phone": "13800138000"
  }
}
```

**使用页面**：login.html

---

#### 1.2 用户注册

```http
POST /api/register
```

**请求体**：
```json
{
  "student_id": "202102",
  "name": "李四",
  "phone": "13900139000",
  "password": "123456"
}
```

**成功响应** (200)：
```json
{
  "msg": "注册成功，请等待管理员审核"
}
```

**使用页面**：register.html

---

### 2. 个人信息

#### 2.1 更新个人资料

```http
PUT /api/profile
```

**请求头**：需要Authorization

**请求体**：
```json
{
  "name": "张三",
  "phone": "13800138000"
}
```

**成功响应** (200)：
```json
{
  "msg": "个人信息更新成功",
  "user": {
    "user_id": 1,
    "student_id": "202101",
    "name": "张三",
    "phone": "13800138000",
    "role": "user"
  }
}
```

**使用页面**：personalInfo.html (第520行)

---

#### 2.2 修改密码

```http
PUT /api/change-password
```

**请求头**：需要Authorization

**请求体**：
```json
{
  "currentPassword": "123456",
  "newPassword": "newpass123"
}
```

**成功响应** (200)：
```json
{
  "msg": "密码修改成功"
}
```

**失败响应** (400)：
```json
{
  "msg": "当前密码不正确"
}
```

**使用页面**：personalInfo.html (第599行)

---

### 3. 帖子管理

#### 3.1 获取帖子列表

```http
GET /api/posts?type=express
```

**Query参数**：
- `type`：帖子类型
  - `express` - 代拿快递
  - `takeaway` - 代拿外卖
  - `carShare` - 求合租车
  - `experience` - 经验分享
  - 不传则返回所有

**成功响应** (200)：
```json
[
  {
    "post_id": 1,
    "user_id": 2,
    "type": "daigou_express",
    "title": "帮拿韵达快递",
    "content": "12号楼快递站",
    "reward": 5,
    "pickup_location": "快递站",
    "deliver_location": "5号宿舍楼",
    "deadline": "2024-11-25T18:00:00",
    "is_verified": 1,
    "created_at": "2024-11-25T10:00:00",
    "author_name": "李四",
    "accept_count": 0
  }
]
```

**使用页面**：forum.html (第650行)

---

#### 3.2 发布帖子

```http
POST /api/posts
```

**请求头**：需要Authorization

**请求体**（代拿快递）：
```json
{
  "type": "daigou_express",
  "title": "帮拿韵达快递",
  "content": "12号楼快递站",
  "reward": 5,
  "pickup_location": "快递站",
  "deliver_location": "5号宿舍楼",
  "deadline": "2024-11-25T18:00:00",
  "remark": "感谢"
}
```

**请求体**（求合租车）：
```json
{
  "type": "share",
  "title": "周末去市区",
  "content": "有人一起吗",
  "route": "学校-火车站",
  "share_time": "2024-11-26T09:00:00",
  "share_person": 3,
  "remark": "AA制"
}
```

**成功响应** (200)：
```json
{
  "msg": "发布成功",
  "post_id": 10
}
```

**使用页面**：forum.html (第730行)

---

#### 3.3 删除帖子

```http
DELETE /api/posts/:post_id
```

**请求头**：需要Authorization

**路径参数**：
- `post_id`：帖子ID

**成功响应** (200)：
```json
{
  "msg": "帖子已删除"
}
```

**失败响应** (403)：
```json
{
  "msg": "无权删除此帖子"
}
```

**使用页面**：forum.html (第1327行)

---

#### 3.4 获取我的帖子

```http
GET /api/posts/my?user_id=1&type=published
```

**Query参数**：
- `user_id`：用户ID
- `type`：
  - `published` - 我发布的
  - `accepted` - 我接单的

**成功响应** (200)：
```json
[
  {
    "post_id": 1,
    "type": "daigou_express",
    "title": "帮拿快递",
    "status": "pending",
    "created_at": "2024-11-25T10:00:00",
    "accept_count": 2
  }
]
```

**使用页面**：
- forum.html 第1013行（我发布的）
- forum.html 第1154行（我接单的）
- forum.html 第1247行（其他帖子）

---

#### 3.5 接单

```http
POST /api/posts/accept
```

**请求头**：需要Authorization

**请求体**：
```json
{
  "post_id": 1
}
```

**成功响应** (200)：
```json
{
  "msg": "接单成功",
  "accept_id": 5
}
```

**失败响应** (400)：
```json
{
  "msg": "不能接自己发布的帖子"
}
```

**使用页面**：forum.html (第690行)

---

### 4. 车辆管理

#### 4.1 获取车辆列表

```http
GET /api/vehicles
```

**Query参数**（可选）：
- `type`：车辆类型（bike/ebike）
- `min_price`：最低价格
- `max_price`：最高价格

**成功响应** (200)：
```json
[
  {
    "vehicle_id": 1,
    "user_id": 2,
    "type": "bike",
    "location_lat": 39.9042,
    "location_lng": 116.4074,
    "location_desc": "5号楼门口",
    "daily_price": 10,
    "status": "available",
    "is_verified": 1
  }
]
```

**使用页面**：index.html, carRent.html

---

#### 4.2 发布车辆

```http
POST /api/vehicles
```

**请求头**：需要Authorization

**请求体**：
```json
{
  "type": "bike",
  "location_lat": 39.9042,
  "location_lng": 116.4074,
  "location_desc": "5号楼门口",
  "daily_price": 10
}
```

**成功响应** (200)：
```json
{
  "msg": "车辆发布成功，请等待审核",
  "vehicle_id": 5
}
```

**使用页面**：rent.html

---

### 5. 管理员接口

#### 5.1 获取待审核列表

```http
GET /api/admin/pending
```

**请求头**：需要Authorization（管理员）

**成功响应** (200)：
```json
{
  "users": [
    {
      "user_id": 3,
      "student_id": "202103",
      "name": "王五"
    }
  ],
  "vehicles": [
    {
      "vehicle_id": 2,
      "type": "bike",
      "location_desc": "3号楼"
    }
  ],
  "posts": [
    {
      "post_id": 5,
      "title": "帮拿快递",
      "pickup_location": "快递站"
    }
  ]
}
```

**使用页面**：admin.html

---

#### 5.2 审核通过

```http
POST /api/admin/approve
```

**请求头**：需要Authorization（管理员）

**请求体**：
```json
{
  "type": "user",
  "id": 3
}
```

**类型说明**：
- `type: "user"` - 审核用户
- `type: "vehicle"` - 审核车辆
- `type: "post"` - 审核帖子

**成功响应** (200)：
```json
{
  "msg": "审核通过"
}
```

**使用页面**：admin.html

---

#### 5.3 添加管理员

```http
POST /api/admin/add-admin
```

**请求头**：需要Authorization（管理员）

**请求体**：
```json
{
  "student_id": "admin002",
  "name": "管理员2",
  "phone": "13900139000",
  "password": "admin123"
}
```

**成功响应** (200)：
```json
{
  "msg": "管理员账号创建成功"
}
```

**使用页面**：personalInfo.html (第649行)

---

### 6. 统计数据

#### 6.1 获取系统统计

```http
GET /api/stats
```

**成功响应** (200)：
```json
{
  "totalUsers": 50,
  "totalVehicles": 30,
  "totalPosts": 100,
  "todayOrders": 5
}
```

**使用页面**：index.html, admin.html

---

## 🔒 错误码说明

| 状态码 | 说明 | 常见原因 |
|-------|------|---------|
| 200 | 成功 | 请求正常处理 |
| 400 | 请求错误 | 参数缺失或格式错误 |
| 401 | 未授权 | 未登录或token无效 |
| 403 | 禁止访问 | 无权限操作 |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 后端异常 |

---

## 💡 使用示例

### 完整的API调用流程

```javascript
// 1. 检查登录状态
const userId = localStorage.getItem('user_id');
if (!userId) {
  alert('请先登录');
  window.location.href = '/login.html';
  return;
}

// 2. 发送请求
try {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + userId
    },
    body: JSON.stringify({
      type: 'daigou_express',
      title: '帮拿快递',
      content: '12号楼',
      reward: 5,
      pickup_location: '快递站',
      deliver_location: '5号楼',
      deadline: '2024-11-25T18:00:00'
    })
  });

  // 3. 处理响应
  const result = await res.json();
  
  if (res.ok) {
    alert('发布成功');
    // 刷新列表或跳转
  } else {
    alert(result.msg || '发布失败');
  }
  
} catch (error) {
  console.error('请求失败', error);
  alert('网络错误：' + error.message);
}
```

---

## 🔍 调试技巧

### 1. 查看请求详情

打开Chrome DevTools → Network标签：
- 点击请求可查看详细信息
- Headers：查看请求头
- Payload：查看请求体
- Response：查看响应数据

### 2. 常见问题排查

**401错误**：
```javascript
// 检查token
console.log('user_id:', localStorage.getItem('user_id'));

// 检查请求头
console.log('headers:', {
  'Authorization': 'Bearer ' + localStorage.getItem('user_id')
});
```

**400错误**：
```javascript
// 检查请求体
const body = {
  type: 'daigou_express',
  title: '帮拿快递'
};
console.log('body:', body);
console.log('JSON:', JSON.stringify(body));
```

---

## 📝 备注

1. **所有时间**都使用ISO 8601格式：`2024-11-25T18:00:00`
2. **所有请求**（除了登录/注册）都需要Authorization头
3. **用户ID**从localStorage获取，登录时保存
4. **删除操作**需要验证权限（只能删除自己的内容）
5. **管理员接口**需要role为admin

---

**文档版本**：v1.0
**最后更新**：2024-11-25
