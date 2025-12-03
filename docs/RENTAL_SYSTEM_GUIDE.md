# 租车系统完善功能说明

> 本文档说明租车功能的完整流程和使用方法

---

## 🎯 功能概述

本次更新完善了校园车辆租赁系统，实现了完整的租车流程，包括：
- ✅ 在线预订车辆
- ✅ 预订成功后显示车主联系方式（加密）
- ✅ 双方确认机制（车主确认→租客完成）
- ✅ 我的订单管理（我租的车、租我车的、历史记录）
- ✅ 行程历史统计（时长、费用）

---

## 📱 完整租车流程

### 步骤1：浏览车辆

**页面**：`/carRent.html`

用户可以通过两种方式浏览可租车辆：
- **地图模式**：在地图上查看车辆位置
- **列表模式**：列表形式查看车辆详情

**筛选功能**：
- 车辆类型：电动车/自行车
- 价格范围：自定义最低/最高价格

---

### 步骤2：提交订单

**操作**：点击"立即租用"或"租车"按钮

**填写信息**：
- 租用时长（1-6小时）
- 系统自动计算总费用

**提交后**：
- 后端创建订单（状态：pending）
- 前端显示订单成功Modal

---

### 步骤3：获取车主联系方式 ⭐

**订单成功Modal显示**：

```
🎉 预订成功

📋 订单信息
订单号：123
车辆类型：电动车
取车地点：东区宿舍楼下
租用时长：2 小时
预计费用：6 元

📞 车主联系方式
车主姓名：张*
手机号：138****5678

💡 温馨提示：
- 车主确认后，订单状态变为"已确认"
- 取车后请线下支付费用给车主
- 使用完毕后，双方确认完成订单
```

**联系方式加密规则**：
- 姓名：只显示姓（如：张三 → 张*）
- 手机号：显示前3位和后4位（如：13812345678 → 138****5678）

**代码位置**：
- 前端：`carRent.html` 第563-569行
- 后端：`server.js` 第609-622行

---

### 步骤4：车主确认订单

**页面**：`/personalInfo.html` → "租我车的"标签

**车主操作**：
1. 查看待确认的订单（状态：pending）
2. 查看租客联系方式
3. 点击"确认订单"按钮

**确认后**：
- 订单状态：pending → confirmed
- 租客收到通知（订单状态更新）
- 租客可以联系车主取车

**API接口**：`POST /api/orders/confirm`

---

### 步骤5：线下交车和支付

**租客操作**：
1. 通过电话/微信联系车主
2. 约定取车时间和地点
3. 线下支付费用给车主
4. 开始使用车辆

**说明**：
- 本系统不处理线上支付
- 所有交易线下完成
- 请双方当面确认车辆状况

---

### 步骤6：完成订单

**双方都可以操作**：

#### 租客完成订单
**页面**：`/personalInfo.html` → "我租的车"标签
**操作**：点击"确认完成"按钮

#### 车主完成订单
**页面**：`/personalInfo.html` → "租我车的"标签
**操作**：点击"确认完成"按钮

**完成后**：
- 订单状态：confirmed → completed
- 记录完成时间
- 订单进入历史记录

**API接口**：`POST /api/orders/complete`

---

### 步骤7：查看历史记录

**页面**：`/personalInfo.html` → "历史记录"标签

**显示信息**：
- 所有已完成和已取消的订单
- 订单详情（时长、费用、状态）
- 统计数据（总订单数、总费用等）

**查询范围**：
- 包含"我租的车"的历史订单
- 包含"租我车的"的历史订单

---

## 🔄 订单状态流转

```
pending（待确认）
    ↓
    车主点击"确认订单"
    ↓
confirmed（已确认）
    ↓
    双方任一点击"确认完成"
    ↓
completed（已完成）
    
或者任何阶段：
    ↓
    双方任一点击"取消订单"
    ↓
cancelled（已取消）
```

---

## 📊 订单管理界面

### 我的订单标签页

**位置**：`/personalInfo.html` → "我的租车订单"区域

#### 标签1：我租的车

**显示内容**：
- 我作为租客的所有进行中订单（pending + confirmed）
- 车主联系方式
- 订单详细信息

**可用操作**：
- pending状态：取消订单
- confirmed状态：确认完成、取消订单

---

#### 标签2：租我车的

**显示内容**：
- 我作为车主的所有进行中订单（pending + confirmed）
- 租客联系方式
- 订单详细信息

**可用操作**：
- pending状态：确认订单、拒绝订单
- confirmed状态：确认完成

---

#### 标签3：历史记录

**显示内容**：
- 所有已完成（completed）的订单
- 所有已取消（cancelled）的订单
- 包含我租的和租我车的

**统计信息**：
- 总订单数
- 总租车时长
- 总费用

**无操作按钮**（只读）

---

## 🎨 UI设计

### 订单卡片样式

```html
<div class="order-card">
  <div class="order-header">
    <span class="order-id">订单号：123</span>
    <span class="order-status pending">待确认</span>
  </div>
  <div class="order-body">
    <!-- 订单详情 -->
  </div>
  <div class="contact-info">
    <!-- 联系方式 -->
  </div>
  <div class="order-actions">
    <!-- 操作按钮 -->
  </div>
</div>
```

### 状态标签颜色

| 状态 | 颜色 | 背景色 |
|-----|------|--------|
| pending（待确认） | #856404 | #fff3cd（黄色） |
| confirmed（已确认） | #0c5460 | #d1ecf1（蓝色） |
| completed（已完成） | #155724 | #d4edda（绿色） |
| cancelled（已取消） | #721c24 | #f8d7da（红色） |

---

## 🔧 技术实现

### 前端文件修改

#### 1. carRent.html

**新增Modal**（第221-270行）：
```html
<!-- 订单成功Modal - 显示联系信息 -->
<div class="modal fade" id="orderSuccessModal">
  <!-- 订单信息 + 车主联系方式 -->
</div>
```

**修改订单提交逻辑**（第510-586行）：
- 禁用按钮防止重复提交
- 调用API创建订单
- 获取车主信息并加密显示
- 显示订单成功Modal

---

#### 2. personalInfo.html

**新增订单区域**（第441-451行）：
```html
<h5 class="feature-title mt-4">我的租车订单</h5>
<div class="order-tabs mb-3">
  <button class="order-tab active" id="rentedTab">我租的车</button>
  <button class="order-tab" id="ownedTab">租我车的</button>
  <button class="order-tab" id="historyTab">历史记录</button>
</div>
<div id="orderListContainer" class="order-list">
  <!-- 动态加载 -->
</div>
```

**新增样式**（第144-253行）：
- 订单标签页样式 `.order-tabs`
- 订单卡片样式 `.order-card`
- 状态标签样式 `.order-status`

**新增JavaScript函数**（第834-1099行）：
- `initOrderTabs()` - 初始化标签切换
- `loadMyOrders(type)` - 加载订单列表
- `renderOrderCard(order, type)` - 渲染订单卡片
- `confirmOrder(orderId)` - 车主确认订单
- `completeOrder(orderId)` - 完成订单
- `cancelOrder(orderId)` - 取消订单

---

### 后端API修改

#### 1. POST /api/orders

**修改**（server.js 第603-623行）：

返回值新增：
```javascript
{
  msg: '订单创建成功',
  order_id: 123,          // 新增
  total_fee: 6.00,
  owner_info: {           // 新增
    name: '张三',
    phone: '13812345678'
  }
}
```

---

#### 2. GET /api/orders/my

**新增type参数**（server.js 第630-695行）：
- `rented` - 我租的车（进行中）
- `owned` - 租我车的（进行中）
- `history` - 历史记录（已完成+已取消）

**查询条件**：
- `rented` 和 `owned`：只查询 `status IN ('pending', 'confirmed')`
- `history`：只查询 `status IN ('completed', 'cancelled')`

---

#### 3. 其他API（已存在）

| API | 方法 | 说明 |
|-----|------|------|
| /api/orders/confirm | POST | 车主确认订单 |
| /api/orders/complete | POST | 完成订单 |
| /api/orders/cancel | POST | 取消订单 |

---

## 📝 使用示例

### 示例1：租客租车流程

```javascript
// 1. 浏览车辆
访问 /carRent.html

// 2. 选择车辆并提交订单
点击"租车"按钮 → 填写租用时长 → 提交

// 3. 获取车主联系方式
订单成功Modal显示：
- 车主姓名：张*
- 手机号：138****5678

// 4. 联系车主
通过电话联系车主约定取车

// 5. 查看订单状态
访问 /personalInfo.html → "我租的车"标签
等待车主确认

// 6. 车主确认后，取车并使用

// 7. 使用完毕后
点击"确认完成"按钮

// 8. 查看历史记录
切换到"历史记录"标签查看
```

---

### 示例2：车主出租流程

```javascript
// 1. 发布车辆
访问 /rent.html 发布车辆信息

// 2. 收到租车订单通知
访问 /personalInfo.html → "租我车的"标签

// 3. 查看订单详情
查看租客联系方式：
- 租客姓名：李*
- 手机号：139****9999

// 4. 联系租客并确认订单
点击"确认订单"按钮

// 5. 线下交车
与租客见面，交付车辆并收取费用

// 6. 租客使用完毕后
点击"确认完成"按钮

// 7. 订单完成
订单进入历史记录
```

---

## 🛡️ 安全性说明

### 1. 联系方式加密

**目的**：保护用户隐私，防止信息泄露

**实现**：
- 前端加密显示（JavaScript）
- 后端返回完整信息（需要Authorization）
- 只有订单双方可以查看

**代码**（carRent.html 第563-569行）：
```javascript
// 姓名加密：只显示姓
const encryptedName = ownerName.charAt(0) + '*'.repeat(ownerName.length - 1);

// 手机号加密：显示前3位和后4位
const encryptedPhone = ownerPhone.substring(0, 3) + '****' + ownerPhone.substring(7);
```

---

### 2. 权限验证

**所有订单操作需要验证**：
- 用户登录状态（Authorization header）
- 订单归属权（只能操作自己的订单）

**示例**（server.js 第677-707行）：
```javascript
// 车主确认订单
const [order] = await pool.query('SELECT owner_id FROM orders WHERE order_id = ?', [order_id]);

if (order[0].owner_id != user_id) {
  return res.status(403).json({ msg: '无权确认此订单' });
}
```

---

### 3. 订单状态验证

**防止非法状态转换**：
- pending → confirmed（车主确认）✅
- confirmed → completed（双方完成）✅
- pending → cancelled（双方取消）✅
- completed → pending（不允许）❌

---

## 📊 数据库设计

### orders表结构

```sql
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `renter_id` int NOT NULL COMMENT '租用者ID',
  `owner_id` int NOT NULL COMMENT '车主ID',
  `hours` int NOT NULL COMMENT '租用时长（小时）',
  `total_fee` decimal(5,2) NOT NULL COMMENT '总费用',
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🎯 核心特性

### 1. 双方确认机制

**流程**：
1. 租客下单 → 状态：pending
2. 车主确认 → 状态：confirmed
3. 双方完成 → 状态：completed

**优点**：
- 防止恶意下单
- 保证双方知情
- 记录完整流程

---

### 2. 联系方式加密

**显示规则**：
- 订单创建前：不显示联系方式
- 订单创建后：加密显示（订单成功Modal）
- 订单进行中：完整显示（我的订单页面）
- 订单完成后：保留显示（历史记录）

---

### 3. 历史记录统计

**功能**：
- 查看所有历史订单
- 统计总费用
- 统计总时长
- 区分已完成/已取消

**用途**：
- 个人消费记录
- 收入统计（车主）
- 使用频率分析

---

## 🐛 常见问题

### Q1：订单成功但没有显示车主联系方式？

**原因**：后端API未返回owner_info

**解决**：
1. 检查后端server.js第609-622行
2. 确认API返回包含owner_info字段

---

### Q2：无法确认订单？

**可能原因**：
1. 不是订单的车主
2. 订单状态不是pending
3. 未登录或token失效

**解决**：
1. 检查浏览器控制台错误信息
2. 确认用户身份
3. 重新登录

---

### Q3：历史记录中没有显示联系方式？

**原因**：history查询的SQL字段名不匹配

**解决**：
检查后端SQL查询（server.js第666-684行），确保返回other_name和other_phone字段

---

## 📈 未来优化方向

### 1. 功能扩展
- [ ] 订单评价系统
- [ ] 车辆收藏功能
- [ ] 订单消息通知
- [ ] 自动取消超时订单

### 2. 用户体验
- [ ] 订单搜索和筛选
- [ ] 订单导出功能
- [ ] 移动端适配优化
- [ ] 实时订单状态更新

### 3. 数据分析
- [ ] 订单数据统计图表
- [ ] 用户行为分析
- [ ] 热门车辆排行
- [ ] 收益报表

---

## 📞 技术支持

如有问题，请查看：
- [前端完整指南](./FRONTEND_GUIDE.md)
- [API接口文档](./API_REFERENCE.md)
- [快速参考手册](./QUICK_REFERENCE.md)

---

**文档版本**：v1.0  
**最后更新**：2024-11-25  
**功能状态**：✅ 已完成并测试
