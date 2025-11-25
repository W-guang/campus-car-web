# 📚 项目文档中心

欢迎来到校园车辆共享管理系统的文档中心！

---

## 🎯 文档导航

### 🌟 新手必读

**如果你是新加入的前端开发者**，建议按以下顺序阅读：

1. ✅ [项目概览](#项目概览) - 了解项目基本情况
2. ✅ [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) - 前端文件详细解析
3. ✅ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 快速查找代码位置
4. ✅ [API_REFERENCE.md](./API_REFERENCE.md) - 后端接口文档

### 📖 文档列表

| 文档 | 说明 | 适合人群 |
|-----|------|---------|
| **FRONTEND_GUIDE.md** | 前端文件完整解析，包含每个页面的结构、功能、代码位置 | 前端开发者（必读） |
| **QUICK_REFERENCE.md** | 快速参考手册，帮助快速定位代码和解决问题 | 所有开发者 |
| **API_REFERENCE.md** | 后端API接口文档，包含所有接口的请求/响应格式 | 前端开发者、后端开发者 |
| **FILE_CLEANUP.md** | 废弃文件清理建议（post.html、takeService.html说明） | 项目维护者 |

---

## 🚀 项目概览

### 项目介绍

**校园车辆共享管理系统** 是一个为校园内师生提供车辆共享和互助服务的Web平台。

**核心功能**：
- 🚲 车辆租赁（自行车、电动车）
- 📦 代拿服务（快递、外卖）
- 🚗 拼车服务（求合租车）
- 📝 经验分享（校园生活经验）
- 👤 个人信息管理
- 🔐 用户认证与权限管理

### 技术栈

**前端**：
- HTML5 + CSS3 + JavaScript (ES6+)
- Bootstrap 5.3.0（UI框架）
- 高德地图API 2.0（地图服务）
- Bootstrap Icons（图标库）

**后端**：
- Node.js + Express（Web框架）
- MySQL（数据库）
- JWT（身份验证）

### 项目结构

```
campus-car-web/
├── frontend/              # 前端页面（10个HTML文件）
│   ├── login.html        # 登录页
│   ├── register.html     # 注册页
│   ├── index.html        # 首页（地图）
│   ├── forum.html        # 论坛（核心功能）⭐
│   ├── carRent.html      # 租车页
│   ├── personalInfo.html # 个人信息页
│   ├── rent.html         # 车辆发布页
│   ├── admin.html        # 管理员后台
│   ├── takeService.html  # 代拿服务页
│   └── post.html         # 帖子详情页
├── backend/              # 后端服务
│   └── server.js         # Express服务器
├── database/             # 数据库
│   └── campus_car_share.sql
├── assets/               # 静态资源
│   ├── style.css         # 全局样式
│   └── main.js           # 全局脚本
└── docs/                 # 文档中心（当前目录）
    ├── README.md         # 本文档
    ├── FRONTEND_GUIDE.md # 前端指南
    ├── QUICK_REFERENCE.md# 快速参考
    └── API_REFERENCE.md  # API文档
```

---

## 🎨 前端页面概览

### 页面关系图

```
登录 (login.html)
  ↓
首页 (index.html) ←→ 论坛 (forum.html) ←→ 租车 (carRent.html)
  ↓                      ↓                       ↓
个人信息 (personalInfo.html)
  ├─→ 车辆发布 (rent.html)
  └─→ 管理员后台 (admin.html) [仅管理员]
```

### 核心页面

| 页面 | 文件大小 | 重要程度 | 说明 |
|-----|---------|---------|------|
| forum.html | 68KB | ⭐⭐⭐⭐⭐ | 论坛核心功能，最复杂 |
| carRent.html | 21KB | ⭐⭐⭐⭐ | 租车功能 |
| index.html | 19KB | ⭐⭐⭐⭐ | 首页地图展示 |
| personalInfo.html | 33KB | ⭐⭐⭐ | 个人中心 |
| admin.html | 6KB | ⭐⭐⭐ | 管理员后台 |

---

## 💻 快速开始

### 环境要求

- Node.js 14+
- MySQL 5.7+
- 现代浏览器（Chrome/Firefox/Safari）

### 启动项目

```bash
# 1. 启动MySQL数据库
mysql -u root -p < database/campus_car_share.sql

# 2. 启动后端服务
cd backend
npm install
node server.js

# 3. 访问前端页面
浏览器打开：http://localhost:3000/login.html
```

### 测试账号

```
普通用户：
学号：202101
密码：123456

管理员：
账号：admin
密码：admin123
```

---

## 🔧 开发指南

### 我想修改某个功能，应该看哪个文档？

| 你想做什么 | 查看文档 | 章节 |
|-----------|---------|------|
| 修改登录页样式 | FRONTEND_GUIDE.md | 第1节 |
| 修改论坛帖子卡片 | QUICK_REFERENCE.md | 论坛相关 |
| 添加新的API调用 | API_REFERENCE.md | 对应接口 |
| 修改时间验证规则 | FRONTEND_GUIDE.md | 第4节 + QUICK_REFERENCE.md |
| 添加新的帖子类型 | FRONTEND_GUIDE.md | 第4节修改建议 |
| 修改密码验证规则 | QUICK_REFERENCE.md | 个人信息相关 |

### 开发流程

1. **阅读相关文档** - 了解要修改的代码位置
2. **本地测试** - 修改并在浏览器中测试
3. **检查控制台** - F12查看是否有错误
4. **提交代码** - 确认无误后提交

### 常用开发工具

- **Chrome DevTools** - F12打开，调试必备
- **VSCode** - 推荐的代码编辑器
- **Postman** - 测试API接口（可选）

---

## 📌 重要提示

### 修改前必读

1. ✅ **备份代码** - 修改前先复制一份
2. ✅ **查看文档** - 确认要修改的代码位置
3. ✅ **小步测试** - 每次只改一小部分，立即测试
4. ✅ **保留注释** - 添加注释说明修改内容

### 常见错误

| 错误 | 原因 | 解决方案 |
|-----|------|---------|
| Modal不显示 | 未正确初始化 | 使用`getOrCreateInstance` |
| API 401错误 | 未发送token | 检查Authorization头 |
| 删除功能报错 | postId为undefined | 检查data属性是否正确设置 |
| 样式不生效 | CSS优先级问题 | 清除缓存或使用!important |

---

## 📞 获取帮助

### 遇到问题？

1. **查看文档** - 本目录下的三个文档
2. **查看控制台** - F12打开Chrome DevTools
3. **搜索错误信息** - Google或Stack Overflow
4. **询问团队** - 联系项目负责人

### 提问技巧

好的提问应该包含：
- ✅ 具体的错误信息
- ✅ 你尝试过的解决方法
- ✅ 相关的代码片段
- ✅ 浏览器控制台的截图

❌ 不好的提问：
```
"代码不工作，怎么办？"
```

✅ 好的提问：
```
"forum.html第690行，点击接单按钮后报错401，
控制台显示'Authorization header missing'，
我已经检查了localStorage中有user_id，
请问可能是什么原因？"
```

---

## 🎓 学习资源

### 官方文档

- [Bootstrap 5 文档](https://getbootstrap.com/docs/5.3/)
- [MDN Web文档](https://developer.mozilla.org/zh-CN/)
- [高德地图API](https://lbs.amap.com/api/javascript-api/summary)

### 推荐教程

- [JavaScript ES6教程](https://es6.ruanyifeng.com/)
- [Fetch API教程](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)
- [Bootstrap入门](https://getbootstrap.com/docs/5.3/getting-started/introduction/)

---

## 📝 更新日志

### v1.0 (2024-11-25)

**新功能**：
- ✅ 修复发布帖子Modal错误
- ✅ 添加时间验证（不允许过去时间）
- ✅ UI文字更新（"我的代拿"→"我的帖子"）
- ✅ 添加"其他帖子"标签页
- ✅ 实现删除帖子功能
- ✅ 添加接单详情Modal
- ✅ 实现修改密码功能

**文档更新**：
- ✅ 创建FRONTEND_GUIDE.md
- ✅ 创建QUICK_REFERENCE.md
- ✅ 创建API_REFERENCE.md
- ✅ 创建README.md（本文档）

---

## 🤝 贡献指南

欢迎团队成员完善文档！

**如何贡献**：
1. 发现文档错误或不清楚的地方
2. 修改对应的.md文件
3. 添加或更新相关说明
4. 提交修改并注明更新内容

**文档规范**：
- 使用Markdown格式
- 添加清晰的示例代码
- 使用表格整理信息
- 添加emoji增加可读性 😊

---

## 📄 许可证

本项目仅用于学习和教学目的。

---

**文档维护**：开发团队
**最后更新**：2024-11-25
**文档版本**：v1.0

---

### 📚 快速链接

- [前端完整指南](./FRONTEND_GUIDE.md)
- [快速参考手册](./QUICK_REFERENCE.md)
- [API接口文档](./API_REFERENCE.md)
- [文件清理建议](./FILE_CLEANUP.md)

**祝开发顺利！** 🚀
