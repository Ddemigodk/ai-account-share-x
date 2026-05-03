# AI账号共享系统

## 部署到 Railway（推荐）

### 前置准备
- GitHub 账号：Ddemigodk
- Railway 账号（免费额度足够）

### 第一步：上传代码到 GitHub

1. 打开 https://github.com/new
2. Repository name 填写：`ai-account-share`
3. 选择 **Public**（公开）
4. 点击 **Create repository**
5. 在新页面找到 **"uploading an existing file"** 蓝色链接，点击它
6. 把本 ZIP 压缩包里的**所有文件和文件夹**拖进上传区域（注意：node_modules 和 dist 不需要）
7. 等上传完成后，点击 **Commit changes**

> 💡 上传完成后，你的仓库地址是：`https://github.com/Ddemigodk/ai-account-share`

### 第二步：在 Railway 创建数据库

1. 打开 https://railway.com/new 并登录
2. 拉到最下面，点击 **"Empty Project"**
3. 进入空白项目页面后，点击页面中间偏上的 **"+ New"** 按钮
4. 在弹出的菜单里选择 **Database** → **MySQL**
5. 等待数据库创建完成（约 10 秒）
6. 点击刚创建的 MySQL 卡片，进入详情页
7. 在 **"Connect"** 标签页，复制 **"Connection String"**（形如 `mysql://...`）

### 第三步：在 Railway 部署应用

1. 在同一个项目页面，再次点击 **"+ New"**
2. 选择 **GitHub Repo**
3. 连接 GitHub 账号，找到并选择 `ai-account-share` 仓库
4. Railway 会自动检测 Node.js 项目并开始构建
5. 构建完成后，点击该服务的 **Settings**（齿轮图标）
6. 找到 **Environment Variables**，添加以下变量：
   - `DATABASE_URL` = 刚才复制的 MySQL 连接字符串
   - `APP_SECRET` = 任意随机字符串（如 `my-secret-key-123`）
   - `APP_ID` = `ai-account-share`
   - `VITE_APP_ID` = `ai-account-share`
7. 回到服务页面，点击 **Deploy** 重新部署
8. 部署完成后，点击 **Settings** → **Networking** → 开启 **Public Domain**，获得访问链接

### 第四步：初始化数据库

1. 获得访问链接后，在 Railway 服务的 **Console**（控制台）里运行：
   ```bash
   npx tsx db/seed.ts
   ```
2. 这会创建默认的管理员账号和示例数据

### 第五步：访问系统

用浏览器打开 Railway 给的域名，使用默认账号登录：

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |
| member1 | member123 | 成员 Lv.1 |
| member2 | member123 | 成员 Lv.2 |
| member3 | member123 | 成员 Lv.3 |

---

## 功能说明

- **成员端**：选择时段 → 展开工具类型 → 占用空闲账号 → 查看登录信息
- **管理端**：仪表盘统计 / 成员管理 / 资源管理 / 预约记录
- **自动释放**：时段到期后自动释放账号，无需手动操作

---

## 技术栈

- 前端：React 19 + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Hono + tRPC 11 + Drizzle ORM
- 数据库：MySQL
- 认证：bcrypt + JWT
