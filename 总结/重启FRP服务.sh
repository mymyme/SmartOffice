#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 重启 FRP 客户端服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示当前状态
echo "1️⃣ 当前 FRP 服务状态："
systemctl status frpc --no-pager | head -5
echo ""

# 重启服务
echo "2️⃣ 重启 FRP 服务..."
sudo systemctl restart frpc

if [ $? -ne 0 ]; then
    echo "❌ 重启失败，请检查权限或服务配置"
    exit 1
fi

echo "✅ 重启命令已执行"
echo ""

# 等待服务启动
echo "⏳ 等待 5 秒让服务完全启动..."
sleep 5
echo ""

# 检查服务状态
echo "3️⃣ 检查服务状态："
systemctl is-active frpc

if [ $? -eq 0 ]; then
    echo "✅ FRP 服务运行正常"
else
    echo "❌ FRP 服务未运行"
    echo ""
    echo "查看详细日志："
    echo "sudo journalctl -u frpc -n 50"
    exit 1
fi
echo ""

# 检查端口监听
echo "4️⃣ 检查端口监听状态："
echo ""
echo "   8300 端口 (前端):"
ss -tlnp 2>/dev/null | grep ":8300" || echo "   ❌ 未监听"
echo ""
echo "   8301 端口 (后端):"
ss -tlnp 2>/dev/null | grep ":8301" || echo "   ❌ 未监听"
echo ""

# 等待端口建立
echo "⏳ 等待 FRP 隧道建立（10 秒）..."
sleep 10
echo ""

# 再次检查端口
echo "5️⃣ 再次检查端口："
PORT_8301=$(ss -tlnp 2>/dev/null | grep ":8301" | wc -l)

if [ $PORT_8301 -gt 0 ]; then
    echo "✅ 8301 端口已监听"
else
    echo "⚠️ 8301 端口仍未监听，可能需要更多时间"
    echo ""
    echo "手动检查："
    echo "  ss -tlnp | grep 8301"
    echo ""
    echo "查看日志："
    echo "  sudo journalctl -u frpc -f"
fi
echo ""

# 测试连接
echo "6️⃣ 测试连接："
echo ""

echo "   测试本地后端 (3006)..."
RESULT_3006=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/health 2>/dev/null)
if [ "$RESULT_3006" = "200" ]; then
    echo "   ✅ 本地 3006: 正常"
else
    echo "   ❌ 本地 3006: 失败 (HTTP $RESULT_3006)"
fi

echo "   测试公网后端 (8301)..."
RESULT_8301=$(curl -s -o /dev/null -w "%{http_code}" http://8.152.98.33:8301/health 2>/dev/null)
if [ "$RESULT_8301" = "200" ]; then
    echo "   ✅ 8301: 正常"
else
    echo "   ❌ 8301: 连接失败"
    echo "   （可能需要等待更长时间，或检查 FRP 服务器）"
fi
echo ""

# 测试 CORS
echo "7️⃣ 测试 CORS 预检请求："
CORS_RESULT=$(curl -s -X OPTIONS http://localhost:3006/api/auth/login \
    -H "Origin: http://8.152.98.33:8300" \
    -H "Access-Control-Request-Method: POST" \
    -w "\n%{http_code}" 2>/dev/null | tail -1)

if [ "$CORS_RESULT" = "200" ]; then
    echo "   ✅ CORS 配置正常"
else
    echo "   ❌ CORS 配置异常 (HTTP $CORS_RESULT)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FRP 服务重启完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 访问地址："
echo "   前端: http://8.152.98.33:8300"
echo "   后端: http://8.152.98.33:8301"
echo "   健康检查: http://8.152.98.33:8301/health"
echo ""
echo "📝 查看实时日志："
echo "   sudo journalctl -u frpc -f"
echo ""
echo "📊 查看服务状态："
echo "   systemctl status frpc"
echo ""

