# NovaShelf 灵感资料工作台

> 2026 年计算机综合实训项目 —— 前后端分离的创作灵感资料管理平台

NovaShelf 是一个面向创作者和学习者的灵感资料工作台。用户可以浏览、搜索、查看各类创作素材与灵感资料，发表资料反馈和评分；管理员可以管理资料、审核反馈并查看数据看板。

本项目同时作为计算机综合实训课程成果，附带完整的实训报告、答辩 PPT 和自动化工具链。

---

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速启动](#快速启动)
- [使用 MySQL 数据库](#使用-mysql-数据库)
- [功能列表](#功能列表)
- [API 接口](#api-接口)
- [报告资源 (report-assets)](#报告资源-report-assets)
- [工具脚本 (tools)](#工具脚本-tools)
- [生产部署](#生产部署)
- [示例资料说明](#示例资料说明)

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vite |
| 路由 | Vue Router |
| HTTP 客户端 | Axios |
| 图标库 | lucide-vue-next |
| 后端框架 | Node.js + Express |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| 文件上传 | multer |
| 数据库 | MySQL (mysql2)，内置 mock 数据模式 |
| 包管理 | npm |

---

## 项目结构

```text
实训/
├── novashelf-frontend/          # Vue 3 前端项目
│   ├── src/                     #   源代码（组件、路由、视图）
│   ├── public/                  #   静态资源
│   ├── dist/                    #   构建产物
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── novashelf-backend/           # Express 后端项目
│   ├── routes/                  #   API 路由
│   ├── models/                  #   数据模型
│   ├── middleware/               #   中间件（认证、错误处理等）
│   ├── database/                #   SQL 建表脚本
│   ├── data/                    #   mock 数据和示例资料
│   ├── uploads/                 #   用户上传的封面图片
│   ├── utils/                   #   工具函数
│   ├── scripts/                 #   辅助脚本
│   ├── app.js                   #   应用入口
│   └── package.json
│
├── report-assets/               # 实训报告资源
│   ├── diagrams/                #   系统设计图（功能结构、用例、流程、架构、ER 图）
│   ├── screenshots/             #   系统运行截图
│   ├── render/                  #   渲染中间产物
│   ├── render-docx/             #   docx 渲染中间产物
│   └── rendered-report/         #   最终生成的报告文件
│
├── tools/                       # 自动化工具脚本
│   ├── generate_report.py       #   实训报告自动生成脚本（Python）
│   └── capture_screenshots.cjs  #   系统截图自动捕获脚本（Playwright）
│
├── 2026年计算机综合实训报告-NovaShelf灵感资料工作台.docx
├── NovaShelf实训答辩PPT.pptx
└── README.md                    # 本文件
```

---

## 快速启动

### 1. 启动后端

```bash
cd novashelf-backend
copy .env.example .env      # Windows
# cp .env.example .env      # Linux / macOS
npm install
npm run dev
```

后端默认运行在 `http://localhost:3000`，默认使用 mock 数据模式，无需配置数据库即可运行。

### 2. 启动前端

```bash
cd novashelf-frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。

### 3. 访问系统

打开浏览器访问 http://localhost:5173，使用以下默认账号登录：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 普通用户 | demo | demo123 |

---

## 使用 MySQL 数据库

### 配置连接

编辑 `novashelf-backend/.env`：

```env
USE_MOCK_DB=false
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=novashelf
JWT_SECRET=your_secret_key
PORT=3000
```

### 初始化数据库

方式一：使用内置脚本（支持 `--reset` 重置演示数据）

```bash
cd novashelf-backend
npm run seed
# 重置演示数据：
# npm run seed -- --reset
```

方式二：在 Navicat 或其他数据库工具中执行 `novashelf-backend/database/schema.sql`。

### 数据库表说明

| 表名 | 说明 |
|------|------|
| `users` | 用户账号、密码哈希、头像、角色、创建时间 |
| `resources` | 资料标题、封面、分类、标签、描述、资料入口链接、访问量 |
| `comments` | 资料反馈，关联 users 与 resources |
| `ratings` | 用户评分，同一用户对同一资料仅允许评分一次 |

---

## 功能列表

### 用户功能
- 注册、登录、获取个人信息、退出登录
- 浏览资料列表，查看详情
- 按分类筛选（互动剧本、叙事文本、视觉设定、创作工具、声音素材、灵感备忘）、关键词搜索、排序、分页
- 发表资料反馈、删除自己的反馈
- 对资料评分（每人每资料限一次）

### 管理员功能
- 资料编排：新增、编辑、删除资料
- 上传资料封面图片（限 2MB，限制图片类型）
- 反馈审核：删除任意反馈
- 数据看板：查看用户列表和统计数据

### 安全与校验
- JWT 令牌认证，后台路由守卫
- 前后端表单校验
- MySQL 常用索引优化

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/register` | 用户注册 |
| `POST` | `/api/auth/login` | 用户登录 |
| `GET` | `/api/auth/profile` | 获取当前用户信息 |
| `GET` | `/api/resources` | 资料列表（支持搜索、筛选、分页、排序） |
| `GET` | `/api/resources/:id` | 资料详情 |
| `POST` | `/api/resources` | 新增资料（管理员） |
| `PUT` | `/api/resources/:id` | 编辑资料（管理员） |
| `DELETE` | `/api/resources/:id` | 删除资料（管理员） |
| `POST` | `/api/uploads/cover` | 上传封面图片（管理员） |
| `GET` | `/api/resources/:id/comments` | 获取资料反馈 |
| `POST` | `/api/resources/:id/comments` | 发表资料反馈 |
| `DELETE` | `/api/comments/:id` | 删除反馈 |
| `POST` | `/api/resources/:id/rating` | 提交评分 |
| `GET` | `/api/resources/:id/rating` | 获取评分信息 |
| `GET` | `/api/admin/stats` | 数据看板（管理员） |

---

## 报告资源 (report-assets)

`report-assets/` 目录存放实训报告所需的全部图片和图表资源。

### diagrams/ — 系统设计图

| 文件 | 内容 |
|------|------|
| `fig3-1-function-structure.png` | 系统功能结构图 |
| `fig3-2-use-case.png` | 用例图 |
| `fig3-3-core-flow.png` | 核心业务流程图 |
| `fig4-1-architecture.png` | 系统架构图 |
| `fig4-2-er.png` | 数据库 ER 图 |

### screenshots/ — 系统运行截图

| 文件 | 内容 | 报告图号 |
|------|------|----------|
| `fig5-1-home-resource-list.png` | 首页资料列表、统计和筛选 | 图 5-1 |
| `fig5-2-resource-detail-comments-rating.png` | 资料详情、反馈和评分 | 图 5-2 |
| `fig5-3-login-page.png` | 登录页面 | 图 5-3 |
| `fig5-4-admin-resource-management.png` | 后台资料管理 | 图 5-4 |
| `fig5-5-admin-statistics.png` | 数据看板 | 图 5-5 |
| `fig5-6-admin-resource-form.png` | 后台新增资料表单 | 图 5-6 |

---

## 工具脚本 (tools)

`tools/` 目录包含辅助开发和报告生成的自动化脚本。

### capture_screenshots.cjs — 自动截图

基于 [Playwright](https://playwright.dev/) 自动启动 Edge 浏览器，依次访问系统各页面并截图，保存到 `report-assets/screenshots/`。

**运行前提：**
- 前后端均已启动（前端在 `localhost:5173`）
- 已安装 Playwright：`npm install playwright`（在 `tools/` 目录或项目根目录）

**运行：**

```bash
cd tools
node capture_screenshots.cjs
```

脚本会自动截取首页、详情页、登录页、后台管理等页面，输出与报告图号对应的 PNG 文件。

### generate_report.py — 自动生成实训报告

Python 脚本，读取模板 docx 文件，自动填入项目信息、插入设计图和截图，生成完整的实训报告文档。

**依赖：**

```bash
pip install python-docx Pillow
```

**运行：**

```bash
cd tools
python generate_report.py
```

生成的报告保存至项目根目录：`2026年计算机综合实训报告-NovaShelf灵感资料工作台.docx`

**可配置项（脚本顶部常量）：**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `STUDENT_NAME` | 学生姓名 | （空，需自行填写） |
| `STUDENT_ID` | 学号 | （空，需自行填写） |
| `CLASS_NAME` | 班级 | 计算机科学与技术2023-1班 |
| `SCHOOL` | 学院 | 信息与软件工程学院 |
| `MAJOR` | 专业 | 计算机科学与技术 |
| `TRAINING_TIME` | 实训时间 | 2026年5月18日至2026年6月18日 |

---

## 生产部署

### 前端构建

```bash
cd novashelf-frontend
npm run build
```

构建产物输出到 `dist/` 目录，由 Nginx 托管静态文件。

### 后端部署

使用 PM2 或类似进程管理器运行：

```bash
pm2 start app.js --name novashelf-backend
```

### Nginx 配置参考

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/novashelf-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 示例资料说明

项目内置的示例资料定义在 `novashelf-backend/data/sampleData.js`，链接选用公开可访问、授权清晰的创作素材来源。

资料分类包括：互动剧本、叙事文本、视觉设定、创作工具、声音素材、灵感备忘。
