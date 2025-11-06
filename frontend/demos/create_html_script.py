#!/usr/bin/env python3
# -*- coding: utf-8 -*-

html_content = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>可视化代码编辑器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; height: 100vh; overflow: hidden; background: #1e1e1e; }
        .main-container { display: flex; flex-direction: column; height: 100vh; }
        .header { background: #2d2d30; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3e3e42; z-index: 1000; }
        .header h1 { font-size: 18px; font-weight: 500; }
        .header-controls { display: flex; gap: 10px; }
        .header-controls button { padding: 6px 16px; background: #0e639c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 13px; transition: background 0.2s; }
        .header-controls button:hover { background: #1177bb; }
        .content { display: flex; flex: 1; overflow: hidden; }
        .panel { display: flex; flex-direction: column; border-right: 1px solid #3e3e42; }
        .panel:last-child { border-right: none; }
        .panel-header { background: #2d2d30; color: #cccccc; padding: 8px 15px; font-size: 12px; font-weight: 500; border-bottom: 1px solid #3e3e42; text-transform: uppercase; letter-spacing: 0.5px; }
        .panel-content { flex: 1; overflow: hidden; }
        .left-panel { width: 35%; min-width: 300px; }
        .middle-panel { width: 40%; min-width: 300px; background: white; }
        .right-panel { width: 25%; min-width: 300px; background: #252526; }
        #code-editor { height: 100%; }
        #preview-frame { width: 100%; height: 100%; border: none; background: white; }
        .chat-container { display: flex; flex-direction: column; height: 100%; background: #1e1e1e; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 12px; }
        .chat-message { display: flex; gap: 10px; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; flex-shrink: 0; }
        .user-avatar { background: #0e639c; color: white; }
        .ai-avatar { background: #16825d; color: white; }
        .message-content { flex: 1; background: #2d2d30; padding: 10px 12px; border-radius: 6px; color: #cccccc; font-size: 13px; line-height: 1.5; word-wrap: break-word; }
        .message-content code { background: #1e1e1e; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; }
        .chat-input-area { padding: 15px; background: #252526; border-top: 1px solid #3e3e42; }
        .chat-input-container { display: flex; gap: 8px; }
        .chat-input { flex: 1; padding: 10px 12px; background: #3c3c3c; border: 1px solid #3e3e42; border-radius: 4px; color: #cccccc; font-size: 13px; font-family: inherit; resize: none; min-height: 40px; max-height: 120px; }
        .chat-input:focus { outline: none; border-color: #0e639c; }
        .send-button { padding: 10px 20px; background: #0e639c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s; }
        .send-button:hover { background: #1177bb; }
        .send-button:disabled { background: #3e3e42; cursor: not-allowed; }
        .status-bar { background: #007acc; color: white; padding: 4px 15px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; }
        .chat-messages::-webkit-scrollbar { width: 10px; }
        .chat-messages::-webkit-scrollbar-track { background: #1e1e1e; }
        .chat-messages::-webkit-scrollbar-thumb { background: #424242; border-radius: 5px; }
        .chat-messages::-webkit-scrollbar-thumb:hover { background: #4e4e4e; }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="header">
            <h1>🎨 可视化代码编辑器</h1>
            <div class="header-controls">
                <button onclick="runCode()">▶ 运行代码</button>
                <button onclick="clearCode()">🗑 清空</button>
                <button onclick="saveCode()">💾 保存</button>
            </div>
        </div>
        <div class="content">
            <div class="panel left-panel">
                <div class="panel-header">代码编辑器</div>
                <div class="panel-content"><div id="code-editor"></div></div>
            </div>
            <div class="panel middle-panel">
                <div class="panel-header">实时预览</div>
                <div class="panel-content"><iframe id="preview-frame"></iframe></div>
            </div>
            <div class="panel right-panel">
                <div class="panel-header">AI 对话助手</div>
                <div class="panel-content">
                    <div class="chat-container">
                        <div class="chat-messages" id="chat-messages">
                            <div class="chat-message">
                                <div class="message-avatar ai-avatar">AI</div>
                                <div class="message-content">
                                    你好！我是你的AI编程助手。我可以帮你：<br>
                                    • 解答编程问题<br>• 优化代码<br>• 修复bug<br>• 提供建议<br>
                                    有什么可以帮到你的吗？
                                </div>
                            </div>
                        </div>
                        <div class="chat-input-area">
                            <div class="chat-input-container">
                                <textarea id="chat-input" class="chat-input" placeholder="输入消息...按 Enter 发送，Shift+Enter 换行" rows="1"></textarea>
                                <button class="send-button" onclick="sendMessage()">发送</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="status-bar">
            <span id="status-text">就绪</span>
            <span id="status-info">HTML | UTF-8 | Ln 1, Col 1</span>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs/loader.js"></script>
    <script>
        let editor, updateTimeout;
        const defaultCode = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>示例页面</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); }
        h1 { text-align: center; font-size: 2.5em; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 30px; background: white; color: #667eea; border-radius: 25px; margin: 10px 5px; transition: transform 0.2s; cursor: pointer; border: none; font-size: 16px; }
        .button:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        #counter { font-size: 3em; text-align: center; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 欢迎使用可视化编辑器</h1>
        <p style="text-align: center; font-size: 1.2em;">在左侧编辑代码，中间实时预览效果</p>
        <div id="counter">0</div>
        <div style="text-align: center;">
            <button class="button" onclick="increment()">增加 +</button>
            <button class="button" onclick="decrement()">减少 -</button>
            <button class="button" onclick="reset()">重置</button>
        </div>
    </div>
    <script>
        let count = 0;
        function increment() { count++; document.getElementById('counter').textContent = count; }
        function decrement() { count--; document.getElementById('counter').textContent = count; }
        function reset() { count = 0; document.getElementById('counter').textContent = count; }
    <\\/script>
</body>
</html>`;
        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs' }});
        require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('code-editor'), {
                value: defaultCode, language: 'html', theme: 'vs-dark', automaticLayout: true,
                minimap: { enabled: true }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false,
                wordWrap: 'on', tabSize: 2, formatOnPaste: true, formatOnType: true
            });
            editor.onDidChangeModelContent(() => { updateStatusBar(); clearTimeout(updateTimeout); updateTimeout = setTimeout(() => { updatePreview(); }, 500); });
            updatePreview(); updateStatus('编辑器已就绪');
        });
        function updatePreview() { const code = editor.getValue(); const iframe = document.getElementById('preview-frame'); const iframeDoc = iframe.contentDocument || iframe.contentWindow.document; iframeDoc.open(); iframeDoc.write(code); iframeDoc.close(); updateStatus('预览已更新'); }
        function runCode() { updatePreview(); updateStatus('代码已运行'); }
        function clearCode() { if (confirm('确定要清空代码吗？')) { editor.setValue(''); updateStatus('代码已清空'); } }
        function saveCode() { const code = editor.getValue(); const blob = new Blob([code], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'index.html'; a.click(); URL.revokeObjectURL(url); updateStatus('代码已保存'); }
        function updateStatusBar() { const position = editor.getPosition(); const model = editor.getModel(); const lineCount = model.getLineCount(); document.getElementById('status-info').textContent = `HTML | UTF-8 | 行 ${position.lineNumber}, 列 ${position.column} | 共 ${lineCount} 行`; }
        function updateStatus(message) { document.getElementById('status-text').textContent = message; setTimeout(() => { document.getElementById('status-text').textContent = '就绪'; }, 2000); }
        function sendMessage() { const input = document.getElementById('chat-input'); const message = input.value.trim(); if (!message) return; addMessage(message, 'user'); input.value = ''; setTimeout(() => { const aiResponse = generateAIResponse(message); addMessage(aiResponse, 'ai'); }, 1000); }
        function addMessage(content, type) { const messagesContainer = document.getElementById('chat-messages'); const messageDiv = document.createElement('div'); messageDiv.className = 'chat-message'; const avatarDiv = document.createElement('div'); avatarDiv.className = `message-avatar ${type === 'user' ? 'user-avatar' : 'ai-avatar'}`; avatarDiv.textContent = type === 'user' ? 'U' : 'AI'; const contentDiv = document.createElement('div'); contentDiv.className = 'message-content'; contentDiv.innerHTML = content; messageDiv.appendChild(avatarDiv); messageDiv.appendChild(contentDiv); messagesContainer.appendChild(messageDiv); messagesContainer.scrollTop = messagesContainer.scrollHeight; }
        function generateAIResponse(userMessage) { const lowerMessage = userMessage.toLowerCase(); if (lowerMessage.includes('代码')) { const code = editor.getValue(); return `我看到你的代码了！当前代码有 ${code.split('\\n').length} 行。需要我帮你优化或检查问题吗？`; } else if (lowerMessage.includes('颜色') || lowerMessage.includes('背景')) { return '你可以在CSS中修改 <code>background</code> 属性来改变背景颜色。试试 <code>background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);</code>'; } else if (lowerMessage.includes('居中')) { return '要让元素居中，可以使用：<br><code>display: flex;<br>justify-content: center;<br>align-items: center;</code>'; } else if (lowerMessage.includes('按钮')) { return '我看到你的代码里有按钮。你可以通过修改 <code>.button</code> 类的样式来自定义按钮外观。'; } else { return '我理解了。你可以告诉我更具体的需求，比如想要什么样的效果或遇到了什么问题，我会尽力帮助你！'; } }
        document.getElementById('chat-input').addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        document.getElementById('chat-input').addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; });
    </script>
</body>
</html>'''

with open('visual-editor.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("visual-editor.html created successfully!")
