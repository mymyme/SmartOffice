const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3005;

// MIME 类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.map': 'application/json'
};

const server = http.createServer((req, res) => {
    // 解析 URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // 本地 monaco-editor 静态映射：/vs/* -> node_modules/monaco-editor/min/vs/*
    if (pathname.startsWith('/vs/')) {
        const vsRoot = path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'min');
        const filePath = path.join(vsRoot, pathname); // pathname 已以 /vs 开头，对应 min/vs/...
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            fs.readFile(filePath, (readErr, data) => {
                if (readErr) {
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Internal Server Error');
                    return;
                }
                res.writeHead(200, {
                    'Content-Type': contentType + '; charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.end(data);
            });
        });
        return;
    }

    // 默认页面
    if (pathname === '/') {
        pathname = '/demos/visual-editor.html';
    }

    // AI 演示页面
    if (pathname === '/ai') {
        pathname = '/demos/ai-demo.html';
    }

    // 路径别名映射
    if (pathname === '/visual-editor.html') {
        pathname = '/demos/visual-editor.html';
    }
    if (pathname === '/default-code-in-editor.html') {
        pathname = '/demos/default-code-in-editor.html';
    }
    if (pathname === '/profile.html') {
        pathname = '/demos/profile.html';
    }
    if (pathname === '/admin.html') {
        pathname = '/demos/admin.html';
    }
    if (pathname === '/login.html') {
        pathname = '/demos/login.html';
    }

    // 构建文件路径 - 相对于 frontend 目录
    // __dirname 是 frontend/services，所以需要回到上一级
    const baseDir = path.join(__dirname, '..');
    const filePath = path.join(baseDir, pathname);

    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件不存在，返回 404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - 页面未找到</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #e74c3c; }
                        a { color: #3498db; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>404 - 页面未找到</h1>
                    <p>请求的页面不存在: ${pathname}</p>
                    <p><a href="/">返回首页</a></p>
                </body>
                </html>
            `);
            return;
        }

        // 获取文件扩展名
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // 读取文件
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - 服务器错误</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - 服务器错误</h1>
                        <p>读取文件时发生错误</p>
                    </body>
                    </html>
                `);
                return;
            }

            // 设置响应头
            res.writeHead(200, {
                'Content-Type': contentType + '; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            // 发送文件内容
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Monaco Editor 服务器已启动！`);
    console.log(`📁 服务目录: ${__dirname}`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`📄 演示页面: http://localhost:${PORT}/demo.html`);
    console.log(`⏹️  按 Ctrl+C 停止服务器`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
