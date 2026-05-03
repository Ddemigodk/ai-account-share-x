#!/bin/bash
set -e

echo "========================================"
echo "  AI账号共享系统 - macOS 一键部署脚本"
echo "========================================"
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "${RED}❌ 未安装 Node.js${NC}"
    echo "请先安装 Node.js 20+：https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "${RED}❌ Node.js 版本过低：$(node -v)，需要 20+${NC}"
    exit 1
fi
echo "${GREEN}✅ Node.js $(node -v)${NC}"

# 检查 git
if ! command -v git &> /dev/null; then
    echo "${RED}❌ 未安装 git${NC}"
    echo "请先安装 git：brew install git"
    exit 1
fi
echo "${GREEN}✅ git $(git --version)${NC}"

# 检查 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "${YELLOW}⚠️ 未安装 cloudflared，正在安装...${NC}"
    if command -v brew &> /dev/null; then
        brew install cloudflared
    else
        echo "${RED}❌ 请先安装 Homebrew：https://brew.sh${NC}"
        exit 1
    fi
fi
echo "${GREEN}✅ cloudflared $(cloudflared --version 2>&1 | head -1)${NC}"

echo ""
echo "========================================"
echo "  安装依赖并构建"
echo "========================================"
echo ""

npm install
npm run build

echo ""
echo "========================================"
echo "  初始化数据库"
echo "========================================"
echo ""

npm run db:push
npx tsx db/seed.ts

echo ""
echo "========================================"
echo "  配置开机自启"
echo "========================================"
echo ""

mkdir -p ~/Library/LaunchAgents

cat > ~/Library/LaunchAgents/com.ai-share.server.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ai-share.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>NODE_PATH</string>
        <string>PROJECT_PATH/dist/boot.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>PROJECT_PATH</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ai-share-server.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ai-share-server.log</string>
</dict>
</plist>
EOF

# 替换路径
NODE_PATH=$(which node)
PROJECT_PATH=$(pwd)
sed -i '' "s|NODE_PATH|$NODE_PATH|g" ~/Library/LaunchAgents/com.ai-share.server.plist
sed -i '' "s|PROJECT_PATH|$PROJECT_PATH|g" ~/Library/LaunchAgents/com.ai-share.server.plist

cat > ~/Library/LaunchAgents/com.ai-share.tunnel.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ai-share.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>--url</string>
        <string>http://localhost:3000</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ai-share-tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ai-share-tunnel.log</string>
</dict>
</plist>
EOF

echo "${GREEN}✅ 开机自启配置完成${NC}"

echo ""
echo "========================================"
echo "  启动服务"
echo "========================================"
echo ""

launchctl load ~/Library/LaunchAgents/com.ai-share.server.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.ai-share.tunnel.plist 2>/dev/null || true

echo "等待服务启动..."
sleep 6

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""

# 获取链接
URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/ai-share-tunnel.log | tail -1)

if [ -n "$URL" ]; then
    echo "${GREEN}🌐 团队访问链接：${URL}${NC}"
else
    echo "${YELLOW}⏳ 链接生成中，10秒后再运行以下命令查看：${NC}"
    echo "   grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/ai-share-tunnel.log | tail -1"
fi

echo ""
echo "默认账号："
echo "  管理员：admin / admin123"
echo "  成员1：member1 / member123"
echo "  成员2：member2 / member123"
echo ""
echo "常用命令："
echo "  查看链接：grep -oE 'https://.*trycloudflare.com' /tmp/ai-share-tunnel.log | tail -1"
echo "  停止服务：launchctl unload ~/Library/LaunchAgents/com.ai-share.server.plist"
echo "  启动服务：launchctl load ~/Library/LaunchAgents/com.ai-share.server.plist"
echo "  查看日志：tail -f /tmp/ai-share-server.log"
echo ""
