# 车辆管理系统功能说明

> 本文档说明全新的车辆管理功能，整合了车辆注册、订单管理等功能

---

## 🎯 功能概述

本次更新将个人中心的"车辆发布"和"租车订单"整合为统一的**"车辆管理"**模块，实现了：

- ✅ 我的车辆管理（查看、添加、修改、删除）
- ✅ 申请注册新车辆（提交审核）
- ✅ 车辆状态跟踪（待审核、已通过、已拒绝）
- ✅ 我租的车（租客订单）
- ✅ 租我车的（车主订单）
- ✅ 历史记录（已完成/已取消订单）

---

## 📋 功能模块

### 1. 车辆管理入口

**位置**：`/personalInfo.html` → "车辆管理"卡片

**包含标签页**：
- 我的车辆
- 我租的车
- 租我车的
- 历史记录

---

## 🚗 我的车辆功能

### 功能特性

1. **查看我的车辆列表**
   - 显示所有我注册的车辆
   - 实时显示审核状态（待审核/已通过/已拒绝）
   - 显示车辆详细信息（类型、位置、价格）

2. **申请注册新车辆**
   - 点击"申请注册新车辆"按钮
   - 填写车辆信息：
     - 车辆类型（电动车/自行车）
     - 取车地点
     - 租金（元/小时）
     - 车辆描述（可选）
   - 提交后等待管理员审核

3. **管理已有车辆**
   - **已通过审核**：可修改价格、删除车辆
   - **待审核**：可取消申请
   - **已拒绝**：可重新申请或删除

---

## 📝 注册车辆流程

### 步骤1：打开申请表单

**操作**：个人中心 → 车辆管理 → 我的车辆 → 点击"申请注册新车辆"

**表单字段**：
```
车辆类型：[电动车/自行车] *必填
取车地点：例如"东区宿舍楼下" *必填
租金（元/小时）：1-50元 *必填
车辆描述：简单描述车辆特点（可选）
```

---

### 步骤2：填写车辆信息

**填写要求**：
- 车辆类型必须选择
- 取车地点要详细明确
- 租金建议：
  - 自行车：1-3元/小时
  - 电动车：3-10元/小时
- 车辆描述可填写外观、性能等特点

**示例**：
```
车辆类型：电动车
取车地点：东区6号楼一楼停车棚
租金：5元/小时
车辆描述：爱玛品牌电动车，续航50公里，车况良好
```

---

### 步骤3：提交审核

**提交后**：
- 车辆状态：待审核（黄色标签）
- 显示在"我的车辆"列表中
- 等待管理员审核

**审核结果**：
1. **通过审核** → 状态变为"已通过"（绿色）→ 车辆上架，可被租用
2. **拒绝审核** → 状态变为"已拒绝"（红色）→ 可重新申请或删除

---

### 步骤4：管理审核通过的车辆

**可用操作**：
1. **修改价格**：点击"修改"按钮，输入新价格
2. **删除车辆**：点击"删除"按钮（需确认无进行中订单）

---

## 🎨 界面设计

### 车辆卡片样式

```
┌────────────────────────────────────────────────┐
│  🚲  电动车                        [已通过]   │
│      📍 东区6号楼一楼停车棚                    │
│      💰 5 元/小时                              │
│      爱玛品牌电动车，续航50公里，车况良好      │
│                                 [修改] [删除]  │
└────────────────────────────────────────────────┘
```

### 状态标签颜色

| 状态 | 颜色 | 说明 |
|-----|------|------|
| 待审核 | 🟡 黄色 | 已提交，等待管理员审核 |
| 已通过 | 🟢 绿色 | 审核通过，车辆可租用 |
| 已拒绝 | 🔴 红色 | 审核未通过，可重新申请 |

---

## 🔧 技术实现

### 前端修改

#### 1. personalInfo.html

**修改位置**：`loadRoleFeatures`函数（第536-566行）

**新增内容**：
```javascript
// 车辆管理标签页
<div class="order-tabs mb-3">
  <button class="order-tab active" id="myVehiclesTab">我的车辆</button>
  <button class="order-tab" id="rentedTab">我租的车</button>
  <button class="order-tab" id="ownedTab">租我车的</button>
  <button class="order-tab" id="historyTab">历史记录</button>
</div>
```

**新增Modal**：申请注册车辆（第411-459行）

**新增JavaScript函数**：
- `initVehicleManageTabs()` - 初始化标签切换
- `loadMyVehicles()` - 加载我的车辆列表
- `renderVehicleCard(vehicle)` - 渲染车辆卡片
- `bindAddVehicle()` - 绑定添加车辆事件
- `deleteVehicle(vehicleId)` - 删除车辆
- `editVehicle(vehicleId)` - 编辑车辆价格
- `updateVehiclePrice(vehicleId, newPrice)` - 更新价格
- `reapplyVehicle(vehicleId)` - 重新申请审核

---

### 后端API

#### 新增接口

| 接口 | 方法 | 说明 |
|-----|------|------|
| /api/vehicles | POST | 创建车辆（支持description） |
| /api/vehicles/my | GET | 获取我的车辆列表 |
| /api/vehicles/:id | PUT | 更新车辆信息（价格） |
| /api/vehicles/:id | DELETE | 删除车辆 |
| /api/vehicles/:id/reapply | POST | 重新申请审核 |

---

#### API详细说明

##### 1. POST /api/vehicles

**功能**：创建新车辆，提交审核

**请求头**：
```
Authorization: Bearer {user_id}
Content-Type: application/json
```

**请求体**：
```json
{
  "type": "ebike",
  "location_desc": "东区6号楼一楼停车棚",
  "price_per_hour": 5,
  "description": "爱玛品牌电动车，续航50公里",
  "lng": 112.58451,
  "lat": 37.79676
}
```

**响应**：
```json
{
  "msg": "车辆注册申请已提交，待管理员审核"
}
```

---

##### 2. GET /api/vehicles/my

**功能**：获取当前用户的所有车辆

**请求头**：
```
Authorization: Bearer {user_id}
```

**响应**：
```json
[
  {
    "vehicle_id": 1,
    "owner_id": 123,
    "type": "ebike",
    "location_desc": "东区6号楼一楼停车棚",
    "price_per_hour": 5.00,
    "description": "爱玛品牌电动车，续航50公里",
    "is_verified": 1,
    "created_at": "2024-11-25T10:30:00.000Z"
  }
]
```

**is_verified字段**：
- `0` - 待审核
- `1` - 已通过
- `2` - 已拒绝

---

##### 3. PUT /api/vehicles/:id

**功能**：修改车辆价格

**请求头**：
```
Authorization: Bearer {user_id}
Content-Type: application/json
```

**请求体**：
```json
{
  "price_per_hour": 6
}
```

**响应**：
```json
{
  "msg": "更新成功"
}
```

---

##### 4. DELETE /api/vehicles/:id

**功能**：删除车辆

**请求头**：
```
Authorization: Bearer {user_id}
```

**响应**：
```json
{
  "msg": "删除成功"
}
```

**删除限制**：
- 车辆有进行中的订单时无法删除
- 只能删除自己的车辆

---

##### 5. POST /api/vehicles/:id/reapply

**功能**：重新提交审核（仅限已拒绝的车辆）

**请求头**：
```
Authorization: Bearer {user_id}
```

**响应**：
```json
{
  "msg": "已重新提交审核"
}
```

**限制**：
- 只有`is_verified=2`（已拒绝）的车辆可以重新申请
- 重新申请后状态变为`0`（待审核）

---

## 🔄 车辆状态流转

```
新建车辆 → 待审核(0)
    ↓
管理员审核
    ↓
┌──────────┬──────────┐
│          │          │
通过(1)   拒绝(2)     │
│          │          │
可租用    可重新申请   │
│          ↓          │
可修改    待审核(0)────┘
可删除    ↓
         管理员审核
```

---

## 💡 使用场景示例

### 场景1：新用户注册车辆

```javascript
// 1. 登录系统
访问 /login.html

// 2. 进入个人中心
访问 /personalInfo.html

// 3. 申请注册车辆
点击"申请注册新车辆" → 填写信息 → 提交

// 4. 等待审核
车辆显示"待审核"状态

// 5. 审核通过后
车辆显示"已通过"状态，自动上架
```

---

### 场景2：车主修改车辆价格

```javascript
// 1. 查看我的车辆
个人中心 → 车辆管理 → 我的车辆

// 2. 选择已通过审核的车辆
找到需要修改的车辆卡片

// 3. 修改价格
点击"修改"按钮 → 输入新价格 → 确认

// 4. 价格更新
车辆卡片实时显示新价格
```

---

### 场景3：车辆被拒绝后重新申请

```javascript
// 1. 查看被拒绝的车辆
个人中心 → 车辆管理 → 我的车辆
看到状态为"已拒绝"的车辆

// 2. 重新申请
点击"重新申请"按钮 → 确认

// 3. 状态变更
车辆状态从"已拒绝"变为"待审核"

// 4. 等待管理员审核
```

---

## 🔐 权限控制

### 1. 车辆操作权限

**原则**：只能操作自己的车辆

**验证逻辑**：
```javascript
// 后端验证
const [vehicle] = await pool.query(
  'SELECT owner_id FROM vehicles WHERE vehicle_id = ?',
  [vehicle_id]
);

if (vehicle[0].owner_id != user_id) {
  return res.status(403).json({ msg: '无权操作此车辆' });
}
```

---

### 2. 删除车辆限制

**限制条件**：
- 车辆有进行中的订单时无法删除
- 只能删除自己的车辆

**验证逻辑**：
```javascript
// 检查进行中的订单
const [orders] = await pool.query(
  'SELECT COUNT(*) as count FROM orders WHERE vehicle_id = ? AND status IN ("pending", "confirmed")',
  [vehicle_id]
);

if (orders[0].count > 0) {
  return res.status(400).json({ msg: '该车辆有进行中的订单，无法删除' });
}
```

---

## 📊 数据库设计

### vehicles表字段

```sql
CREATE TABLE `vehicles` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL COMMENT '车主ID',
  `type` enum('ebike','bike') NOT NULL COMMENT '车辆类型',
  `location_desc` varchar(255) NOT NULL COMMENT '取车地点',
  `price_per_hour` decimal(5,2) NOT NULL COMMENT '租金',
  `description` text COMMENT '车辆描述',
  `is_verified` int DEFAULT 0 COMMENT '审核状态:0待审核,1已通过,2已拒绝',
  `lng` decimal(10,7) DEFAULT NULL COMMENT '经度',
  `lat` decimal(10,7) DEFAULT NULL COMMENT '纬度',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vehicle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🎯 与旧功能的对比

| 功能 | 旧版本 | 新版本 |
|-----|-------|--------|
| 车辆发布 | 跳转到/rent.html | 在个人中心内完成 |
| 车辆列表 | 无法查看我的车辆 | 统一管理我的车辆 |
| 订单管理 | 跳转到论坛页面 | 统一在车辆管理模块 |
| 车辆状态 | 无状态跟踪 | 实时显示审核状态 |
| 车辆修改 | 不支持 | 支持修改价格 |
| 重新申请 | 不支持 | 支持重新提交审核 |

---

## 📈 优势特性

### 1. 统一管理界面
- 所有车辆和订单相关功能集中在一个页面
- 标签页切换流畅，用户体验好

### 2. 状态可视化
- 清晰的状态标签（待审核/已通过/已拒绝）
- 实时更新，无需刷新页面

### 3. 灵活的车辆操作
- 修改价格
- 删除车辆
- 重新申请审核

### 4. 完整的权限控制
- 只能操作自己的车辆
- 有订单的车辆无法删除
- 确保数据安全

---

## 🐛 常见问题

### Q1：为什么我的车辆一直是"待审核"状态？

**原因**：需要管理员在后台审核

**解决**：
1. 联系管理员
2. 管理员登录`/admin.html`
3. 在"车辆审核"中审核您的车辆

---

### Q2：如何删除车辆？

**步骤**：
1. 确保车辆没有进行中的订单
2. 在"我的车辆"中找到要删除的车辆
3. 点击"删除"按钮
4. 确认删除

---

### Q3：车辆被拒绝了怎么办？

**解决方案**：
1. 检查拒绝原因（联系管理员）
2. 点击"重新申请"按钮
3. 或者删除后重新创建车辆

---

### Q4：可以修改车辆的其他信息吗？

**当前限制**：
- 只能修改租金价格
- 其他信息（类型、地点、描述）暂不支持修改

**原因**：
- 避免审核后信息变更
- 如需修改其他信息，建议删除后重新创建

---

## 📞 技术支持

相关文档：
- [租车系统完善功能说明](./RENTAL_SYSTEM_GUIDE.md)
- [前端完整指南](./FRONTEND_GUIDE.md)
- [API接口文档](./API_REFERENCE.md)

---

**文档版本**：v1.0  
**最后更新**：2024-11-25  
**功能状态**：✅ 已完成并测试
