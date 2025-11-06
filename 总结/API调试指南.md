# API 调试指南

## 🔍 401 未授权错误排查

### 问题描述
出现 `POST http://localhost:3008/api/chat 401 (Unauthorized)` 错误

### 可能原因

1. **API Key 无效或过期**
2. **API URL 不正确**
3. **API 类型配置错误**
4. **请求格式不正确**

## 🛠️ 调试步骤

### 1. 使用API测试工具

访问测试页面：http://localhost:3005/frontend/demos/api-test.html

**测试步骤**：
1. 填写API配置信息
2. 点击"🧪 测试 API" - 直接测试API
3. 点击"🔗 测试代理服务器" - 通过代理测试

### 2. 检查代理服务器日志

查看代理服务器控制台输出：
```bash
# 查看代理服务器进程
ps aux | grep "ai-proxy.js"

# 查看日志（如果有的话）
tail -f /path/to/ai-proxy.log
```

### 3. 常见配置问题

#### OpenAI API
```
API类型: openai
API URL: https://api.openai.com/v1
API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
模型: gpt-3.5-turbo
```

#### Azure OpenAI
```
API类型: azure
API URL: https://your-resource.openai.azure.com/
API Key: your-azure-api-key
模型: gpt-35-turbo
```

#### 自定义API (如Ollama)
```
API类型: custom
API URL: http://localhost:11434/v1
API Key: (可以留空或使用任意值)
模型: llama2
```

## 🔧 故障排除

### 1. 检查API Key格式

**OpenAI API Key**:
- 格式: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 长度: 通常51个字符
- 前缀: 必须以 `sk-` 开头

**Azure API Key**:
- 格式: 32位十六进制字符串
- 长度: 32个字符
- 无特殊前缀

### 2. 检查API URL

**OpenAI**:
- 正确: `https://api.openai.com/v1`
- 错误: `https://api.openai.com` (缺少/v1)

**Azure**:
- 正确: `https://your-resource.openai.azure.com/`
- 错误: `https://your-resource.openai.azure.com` (缺少结尾斜杠)

### 3. 检查网络连接

```bash
# 测试API连接
curl -I https://api.openai.com/v1

# 测试代理服务器
curl -I http://localhost:3008/api/chat
```

## 📝 调试日志

代理服务器会输出以下调试信息：
```
🔍 API请求信息:
  - API类型: openai
  - API URL: https://api.openai.com/v1
  - 模型: gpt-3.5-turbo
  - API Key: sk-12345678...
```

## 🚀 快速修复

### 1. 重启服务
```bash
# 停止代理服务器
pkill -f "ai-proxy.js"

# 重新启动
cd frontend/services
node ai-proxy.js &
```

### 2. 检查端口占用
```bash
# 检查3008端口
lsof -i :3008

# 检查3005端口
lsof -i :3005
```

### 3. 验证配置
1. 访问 http://localhost:3005/ai
2. 配置API信息
3. 点击"启用AI功能"
4. 尝试发送消息

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：
1. API类型和URL
2. 错误信息截图
3. 代理服务器日志
4. 浏览器控制台错误

---

**最后更新**: 2025-10-30
**状态**: ✅ 可用

