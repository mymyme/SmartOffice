#!/bin/bash

echo "🔄 重启 FRP 客户端以应用新配置..."
echo ""

# 查找 FRP 进程
echo "1️⃣ 查找 FRP 进程..."
FRP_PID=$(ps aux | grep "frpc -c" | grep -v grep | awk '{print $2}')

if [ -z "$FRP_PID" ]; then
    echo "❌ 未找到 FRP 进程"
    exit 1
fi

echo "✅ 找到 FRP 进程: PID=$FRP_PID"
echo ""

# 停止 FRP 进程
echo "2️⃣ 停止 FRP 进程..."
sudo kill $FRP_PID

if [ $? -ne 0 ]; then
    echo "❌ 停止 FRP 进程失败，请检查权限"
    exit 1
fi

echo "✅ FRP 进程已停止"
echo "⏳ 等待 3 秒..."
sleep 3
echo ""

# 启动 FRP 进程
echo "3️⃣ 启动 FRP 进程..."
sudo nohup /home/bn/project/frp/frpc -c /home/bn/project/frp/frpc.toml > /tmp/frpc.log 2>&1 &

sleep 2

# 验证启动
NEW_PID=$(ps aux | grep "frpc -c" | grep -v grep | awk '{print $2}')

if [ -z "$NEW_PID" ]; then
    echo "❌ FRP 启动失败，查看日志: tail /tmp/frpc.log"
    exit 1
fi

echo "✅ FRP 进程已启动: PID=$NEW_PID"
echo ""

# 检查端口监听
echo "4️⃣ 检查端口监听状态..."
sleep 2

PORT_8300=$(ss -tlnp 2>/dev/null | grep ":8300" | wc -l)
PORT_8301=$(ss -tlnp 2>/dev/null | grep ":8301" | wc -l)

echo "   8300 端口 (前端): $PORT_8300 个监听"
echo "   8301 端口 (后端): $PORT_8301 个监听"
echo ""

if [ $PORT_8301 -eq 0 ]; then
    echo "⚠️ 警告：8301 端口未监听，可能需要几秒钟才能建立连接"
    echo "   请等待 10 秒后再次检查："
    echo "   ss -tlnp | grep 8301"
else
    echo "✅ 所有端口均已监听"
fi

echo ""
echo "5️⃣ 测试连接..."

# 测试本地 3006 端口
echo "   测试本地 3006 端口..."
RESULT_3006=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/health 2>/dev/null)
if [ "$RESULT_3006" = "200" ]; then
    echo "   ✅ 本地 3006 端口: 正常 (HTTP $RESULT_3006)"
else
    echo "   ❌ 本地 3006 端口: 失败 (HTTP $RESULT_3006)"
fi

# 测试 8301 端口
echo "   测试 8301 端口..."
RESULT_8301=$(curl -s -o /dev/null -w "%{http_code}" http://8.152.98.33:8301/health 2>/dev/null)
if [ "$RESULT_8301" = "200" ]; then
    echo "   ✅ 8301 端口: 正常 (HTTP $RESULT_8301)"
else
    echo "   ⏳ 8301 端口: 连接中... (请等待 10-30 秒后重试)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FRP 客户端重启完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 访问地址："
echo "   前端: http://8.152.98.33:8300"
echo "   后端: http://8.152.98.33:8301/health"
echo ""
echo "📝 查看 FRP 日志: tail -f /tmp/frpc.log"
echo ""

