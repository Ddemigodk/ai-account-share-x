# 固定域名配置指南

配置完成后，你的网站将拥有一个**永久不变的链接**（如 `https://ai.yourdomain.com`），再也不用每次重启后换链接。

---

## 你需要准备的

1. **Cloudflare 账号**（免费注册）：https://dash.cloudflare.com/sign-up
2. **一个域名**（如 `yourdomain.com`）：
   - 可以在 Cloudflare 购买（约 10 美元/年）
   - 或在其他平台购买后，把 DNS 托管到 Cloudflare

---

## 步骤 1：注册 Cloudflare 并把域名托管过去

### 如果你还没有域名：
1. 登录 https://dash.cloudflare.com
2. 点击左侧 **"注册域"**
3. 搜索并购买你喜欢的域名（推荐 `.com` 或 `.net`）
4. 按提示完成付款

### 如果你已有域名（在阿里云/腾讯云/GoDaddy 等）：
1. 登录 https://dash.cloudflare.com
2. 点击 **"添加站点"**
3. 输入你的域名，选择 **Free 计划**
4. Cloudflare 会给你两个 **名称服务器（Nameserver）**
5. 去你的域名购买平台，把 DNS 改成 Cloudflare 提供的两个名称服务器
6. 等待 5-30 分钟生效

---

## 步骤 2：创建 Tunnel（隧道）

1. 在 Cloudflare Dashboard，点击左侧 **"Zero Trust"**
2. 点击 **"Networks" → "Tunnels"**
3. 点击 **"Create a tunnel"**
4. 选择 **"Cloudflared"**，点击 **Next**
5. **Name**：输入 `ai-share`
6. 点击 **"Save tunnel"**
7. 在下一步，选择 **"Docker"**（不用真的用 Docker，只是为了获取 token）
8. 复制那一长串 `docker run cloudflare/cloudflared tunnel run --token xxxxx` 里的 **token**（`--token` 后面那串字符）

---

## 步骤 3：配置域名指向

1. 还是在刚才的 tunnel 配置页面
2. 找到 **"Public Hostname"** 区域，点击 **"Add a public hostname"**
3. 填写：
   - **Subdomain**：`ai`（或其他你喜欢的，如 `share`）
   - **Domain**：选择你的域名
   - **Path**：留空
   - **Type**：`HTTP`
   - **URL**：`localhost:3000`
4. 点击 **"Save hostname"**

完成后，你的固定域名就是：`https://ai.yourdomain.com`

---

## 步骤 4：填入 Token 并启动

1. 打开文件 `~/.cloudflared/ai-share-token`
2. 把里面的 `YOUR_TOKEN_HERE` 替换成你从 Cloudflare 复制的真实 token
3. 保存文件
4. 重启隧道服务：

```bash
launchctl unload ~/Library/LaunchAgents/com.ai-share.tunnel.plist
launchctl load ~/Library/LaunchAgents/com.ai-share.tunnel.plist
```

5. 等 10 秒后访问你的固定域名：`https://ai.yourdomain.com`

---

## 常见问题

**Q：token 填错了怎么办？**
A：修改 `~/.cloudflared/ai-share-token` 文件，然后重启隧道服务。

**Q：怎么停止固定域名？**
A：
```bash
launchctl unload ~/Library/LaunchAgents/com.ai-share.tunnel.plist
```

**Q：我想换回临时链接（trycloudflare.com）？**
A：把 `~/Library/LaunchAgents/com.ai-share.tunnel.plist` 恢复成原来的版本（从 GitHub 仓库里复制 `com.ai-share.tunnel.plist` 的原始内容），然后重启隧道。

**Q：域名备案问题？**
A：如果你用国外域名（如 `.com`）+ Cloudflare，**不需要**国内备案。只有使用 `.cn` 域名或国内服务器才需要备案。
