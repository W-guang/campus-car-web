# 快速参考手册

> 帮助开发者快速定位代码位置

---

## 🎯 我想修改...

### 登录/注册相关

| 需求 | 文件 | 代码行 | 说明 |
|-----|------|--------|------|
| 登录界面样式 | login.html | 10-30 | 修改CSS样式 |
| 登录验证逻辑 | login.html | 50-80 | 添加验证规则 |
| 注册表单字段 | register.html | 30-50 | 添加/删除字段 |
| 手机号验证规则 | register.html | 65 | 正则表达式 |

### 首页相关

| 需求 | 文件 | 代码行 | 说明 |
|-----|------|--------|------|
| 地图样式 | index.html | 21-26 | 高度、圆角、阴影 |
| 地图初始化 | index.html | 150-180 | 中心点、缩放级别 |
| 统计卡片 | index.html | 28-43 | 样式和布局 |
| 车辆标记 | index.html | 200-250 | 地图上的标记点 |

### 论坛相关（重点）

| 需求 | 文件 | 代码行 | 说明 |
|-----|------|--------|------|
| 帖子标签样式 | forum.html | 80-120 | 快递/外卖等标签 |
| 帖子卡片样式 | forum.html | 150-200 | 卡片布局和颜色 |
| 发布帖子Modal | forum.html | 300-485 | 整个发布表单 |
| 时间验证逻辑 | forum.html | 762, 784, 806 | 三个位置都要改 |
| 接单功能 | forum.html | 690-724 | 接单按钮逻辑 |
| 删除帖子 | forum.html | 1303-1346 | 删除按钮+确认 |
| 我的帖子管理 | forum.html | 1000-1351 | 发布/接单/其他 |

### 个人信息相关

| 需求 | 文件 | 代码行 | 说明 |
|-----|------|--------|------|
| 个人信息表单 | personalInfo.html | 190-215 | 展示字段 |
| 编辑信息Modal | personalInfo.html | 225-266 | 编辑弹窗 |
| 修改密码Modal | personalInfo.html | 268-299 | 密码弹窗 |
| 密码验证规则 | personalInfo.html | 575 | 长度、复杂度 |
| 角色功能区 | personalInfo.html | 423-487 | 用户/管理员差异 |

---

## 🎨 常用样式类

### Bootstrap类

```html
<!-- 布局 -->
<div class="container">                 <!-- 固定宽度容器 -->
<div class="row">                       <!-- 行 -->
<div class="col-md-6">                  <!-- 列（中等屏幕占50%） -->

<!-- 间距 -->
<div class="mt-3">                      <!-- margin-top: 1rem -->
<div class="mb-3">                      <!-- margin-bottom: 1rem -->
<div class="p-3">                       <!-- padding: 1rem -->

<!-- 文字 -->
<p class="text-center">                 <!-- 居中 -->
<p class="text-danger">                 <!-- 红色文字 -->
<p class="fw-bold">                     <!-- 粗体 -->

<!-- 按钮 -->
<button class="btn btn-primary">        <!-- 蓝色按钮 -->
<button class="btn btn-danger">         <!-- 红色按钮 -->
<button class="btn btn-sm">             <!-- 小按钮 -->
```

### 项目自定义类

```html
<!-- 认证页面 -->
<div class="auth-container">            <!-- 登录/注册页面容器 -->
<div class="auth-card">                 <!-- 认证卡片 -->

<!-- 卡片 -->
<div class="vehicle-card">              <!-- 车辆卡片 -->
<div class="stat-card">                 <!-- 统计卡片 -->

<!-- 论坛 -->
<div class="order-card">                <!-- 订单/帖子卡片 -->
<div class="order-header">              <!-- 卡片头部 -->
<div class="order-body">                <!-- 卡片主体 -->
<div class="order-footer">              <!-- 卡片底部 -->
```

---

## 🔧 常用代码片段

### 1. 发送API请求

```javascript
// GET请求
const res = await fetch('/api/posts');
const data = await res.json();

// POST请求
const res = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('user_id')
  },
  body: JSON.stringify({ title: '标题', content: '内容' })
});
const result = await res.json();

// DELETE请求
const res = await fetch(`/api/posts/${postId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('user_id')
  }
});
```

### 2. 操作Modal

```javascript
// 获取Modal实例
const modal = bootstrap.Modal.getOrCreateInstance(
  document.getElementById('myModal')
);

// 显示Modal
modal.show();

// 隐藏Modal
modal.hide();

// 清空表单
document.getElementById('myForm').reset();
```

### 3. 动态创建元素

```javascript
// 创建卡片
const card = document.createElement('div');
card.className = 'order-card';
card.innerHTML = `
  <div class="order-header">
    <span>${title}</span>
  </div>
  <div class="order-body">
    <p>${content}</p>
  </div>
`;

// 添加到容器
container.appendChild(card);
```

### 4. 绑定事件

```javascript
// 单个元素
document.getElementById('myBtn').addEventListener('click', () => {
  alert('点击了');
});

// 批量绑定（动态元素）
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const id = this.dataset.id;
    // 处理逻辑
  });
});
```

### 5. 时间格式化

```javascript
// 转为本地时间字符串
new Date(dateString).toLocaleString('zh-CN')
// 输出：2024/11/25 14:30:00

// 自定义格式
const date = new Date(dateString);
const formatted = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
```

---

## 🐛 常见错误及解决

### 1. Modal不显示

**错误**：点击按钮Modal不弹出

**原因**：
- 未正确引入Bootstrap JS
- Modal ID不匹配
- 使用了错误的方法

**解决**：
```javascript
// ❌ 错误
const modal = bootstrap.Modal.getInstance(element);
modal.show(); // 可能为null

// ✅ 正确
const modal = bootstrap.Modal.getOrCreateInstance(element);
modal.show();
```

### 2. API请求401错误

**错误**：fetch返回401 Unauthorized

**原因**：未发送Authorization头或token无效

**解决**：
```javascript
// 检查token是否存在
const userId = localStorage.getItem('user_id');
if (!userId) {
  alert('请先登录');
  window.location.href = '/login.html';
  return;
}

// 正确发送请求
fetch('/api/endpoint', {
  headers: {
    'Authorization': 'Bearer ' + userId
  }
});
```

### 3. 时间验证失败

**错误**："时间不能早于当前时间"但时间是未来

**原因**：时间格式不对或时区问题

**解决**：
```javascript
// 确保输入是datetime-local格式
<input type="datetime-local" id="deadline">

// 验证时使用Date对象
const inputTime = new Date(document.getElementById('deadline').value);
const now = new Date();
if (inputTime < now) {
  alert('时间不能早于当前时间');
}
```

### 4. 删除功能报错

**错误**："The string did not match the expected pattern"

**原因**：postId为undefined或格式错误

**解决**：
```javascript
// 在HTML中正确设置data属性
<button data-post-id="${post.post_id}">删除</button>

// 在JS中正确获取
const postId = this.dataset.postId;

// 验证后再使用
if (!postId) {
  alert('帖子ID无效');
  return;
}
```

---

## 📋 测试检查清单

### 功能测试

- [ ] 登录/注册功能正常
- [ ] 首页地图正确显示车辆
- [ ] 论坛可以发布帖子
- [ ] 时间验证生效（不能选过去时间）
- [ ] 接单功能正常
- [ ] 删除帖子功能正常
- [ ] 修改密码后需要重新登录
- [ ] 个人信息编辑后正确保存

### 样式测试

- [ ] 页面在不同屏幕尺寸下正常显示
- [ ] 按钮hover效果正常
- [ ] Modal弹窗居中显示
- [ ] 卡片阴影和圆角正常
- [ ] 文字颜色和大小合适

### 浏览器测试

- [ ] Chrome浏览器正常
- [ ] Firefox浏览器正常
- [ ] Safari浏览器正常
- [ ] 移动端浏览器正常

---

## 🎓 学习资源

### Bootstrap

- [官方文档](https://getbootstrap.com/docs/5.3/)
- [栅格系统](https://getbootstrap.com/docs/5.3/layout/grid/)
- [组件](https://getbootstrap.com/docs/5.3/components/)
- [工具类](https://getbootstrap.com/docs/5.3/utilities/)

### JavaScript

- [MDN教程](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
- [DOM操作](https://developer.mozilla.org/zh-CN/docs/Web/API/Document_Object_Model)

### 开发工具

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [VSCode快捷键](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)

---

**提示**：遇到问题时，先查看浏览器控制台（F12），90%的问题可以通过错误信息定位！
