# AI账号共享系统 - 部署指南

## 方式一：macOS 本地一键部署（推荐小团队）

### 1. 克隆代码

```bash
git clone https://github.com/Ddemigodk/ai-account-share-x.git
cd ai-account-share-x
```

### 2. 一键部署

```bash
./setup-macos.sh
```

脚本会自动完成：
- 检查环境（Node.js 20+、git、cloudflared）
- 安装依赖
- 构建项目
- 初始化 SQLite 数据库
- 插入默认账号数据
- 配置开机自启
- 启动服务 + 公网隧道

### 3. 获取访问链接

```bash
grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/ai-share-tunnel.log | tail -1
```

### 4. 默认账号

| 账号 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 管理员 |
| member1 | member123 | 成员 Lv.1 |
| member2 | member123 | 成员 Lv.2 |
| member3 | member123 | 成员 Lv.3 |

---

## 方式二：换电脑/迁移数据

### 迁移代码

新电脑直接 `git clone`，代码自动同步。

### 迁移数据库（重要！）

SQLite 数据库文件 `data.sqlite` **不在 GitHub 上**，换电脑需要手动拷贝：

**旧电脑 → 新电脑**

```bash
# 旧电脑：导出数据
scp data.sqlite 新电脑用户名@新电脑IP:~/ai-account-share-x/

# 或者直接用 U 盘/微信/邮件发送 data.sqlite 文件
```

把 `data.sqlite` 放到项目根目录后，新电脑直接启动即可，不需要重新运行 seed。

---

## 方式三：Railway 云部署（24小时在线）

代码已配置 Railway，参考 `railway.toml`。

1. 打开 https://railway.com/new
2. 选择 GitHub Repository → `ai-account-share-x`
3. 添加环境变量 `JWT_SECRET`
4. 部署完成

---

## 常用命令

```bash
# 查看服务状态
launchctl list | grep com.ai-share

# 停止服务
launchctl unload ~/Library/LaunchAgents/com.ai-share.server.plist
launchctl unload ~/Library/LaunchAgents/com.ai-share.tunnel.plist

# 启动服务
launchctl load ~/Library/LaunchAgents/com.ai-share.server.plist
launchctl load ~/Library/LaunchAgents/com.ai-share.tunnel.plist

# 查看日志
tail -f /tmp/ai-share-server.log
tail -f /tmp/ai-share-tunnel.log
```
