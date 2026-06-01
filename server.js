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
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // 解析 URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // 路由处理
    if (pathname === '/') {
        // 重定向到基础演示页面
        pathname = '/frontend/demos/demo.html';
    } else if (pathname === '/ai') {
        // 重定向到AI演示页面
        pathname = '/frontend/demos/ai-demo.html';
    } else if (pathname === '/visual') {
        // 重定向到可视化编辑器
        pathname = '/frontend/demos/visual-editor.html';
    } else if (pathname.startsWith('/frontend/')) {
        // 前端文件路径
        pathname = pathname.substring(1); // 移除开头的 /
    } else if (pathname.startsWith('/demos/')) {
        // 兼容旧的演示页面路径
        pathname = '/frontend' + pathname;
    } else if (pathname.startsWith('/static/')) {
        // 静态文件路径
        pathname = '/frontend' + pathname;
    }

    // 构建文件路径
    const filePath = path.join(__dirname, pathname);

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
                    <p><a href="/ai">AI 演示页面</a></p>
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

            // 根据文件类型设置不同的缓存策略
            let cacheHeaders = {};

            // 库文件（echarts, mermaid等）- 长期缓存30天
            if (pathname.includes('/assets/libs/') && (ext === '.js' || ext === '.css')) {
                cacheHeaders = {
                    'Cache-Control': 'public, max-age=2592000, immutable',
                    'Vary': 'Accept-Encoding'
                };
                console.log(`📦 [缓存] 库文件启用30天缓存: ${pathname}`);
            }
            // 其他静态资源（图片、字体等）- 缓存7天
            else if (['.png', '.jpg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
                cacheHeaders = {
                    'Cache-Control': 'public, max-age=604800'
                };
            }
            // CSS和普通JS文件 - 缓存1小时
            else if (ext === '.css' || ext === '.js') {
                cacheHeaders = {
                    'Cache-Control': 'public, max-age=3600'
                };
            }
            // HTML文件 - 不缓存（确保获取最新版本）
            else if (ext === '.html') {
                cacheHeaders = {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                };
            }
            // 其他文件 - 默认不缓存
            else {
                cacheHeaders = {
                    'Cache-Control': 'no-cache'
                };
            }

            // 设置响应头
            res.writeHead(200, {
                'Content-Type': contentType + '; charset=utf-8',
                ...cacheHeaders
            });

            // 发送文件内容
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 SmartOffice 服务器已启动！`);
    console.log(`📁 服务目录: ${__dirname}`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`📄 基础演示: http://localhost:${PORT}/`);
    console.log(`🤖 AI 演示: http://localhost:${PORT}/ai`);
    console.log(`🎨 可视化编辑器: http://localhost:${PORT}/visual`);
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


