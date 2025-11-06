const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3008;

const server = http.createServer((req, res) => {
	// 设置CORS头
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, api-key');

	// 处理预检请求
	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}

	// 只处理POST请求到/api/chat
	if (req.method !== 'POST' || req.url !== '/api/chat') {
		res.writeHead(404);
		res.end('Not Found');
		return;
	}

	let body = '';
	req.on('data', chunk => {
		body += chunk.toString();
	});

	req.on('end', () => {
		try {
			const requestData = JSON.parse(body);
			const { apiUrl, apiType, apiKey, model, messages, max_tokens, temperature } = requestData;

			if (!apiUrl || !apiKey || !model) {
				res.writeHead(400);
				res.end(JSON.stringify({ error: 'Missing required parameters' }));
				return;
			}

			// 添加调试日志
			console.log('🔍 API请求信息:');
			console.log('  - API类型:', apiType);
			console.log('  - API URL:', apiUrl);
			console.log('  - 模型:', model);
			console.log('  - API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : '未提供');

			// 构建目标URL
			let targetUrl;
			if (apiType === 'azure') {
				targetUrl = `${apiUrl}/chat/completions?api-version=2023-12-01-preview`;
			} else {
				targetUrl = `${apiUrl}/chat/completions`;
			}

			// 构建请求头
			const headers = {
				'Content-Type': 'application/json'
			};

			if (apiType === 'azure') {
				headers['api-key'] = apiKey;
			} else {
				headers['Authorization'] = `Bearer ${apiKey}`;
			}

			// 构建请求体
			let requestBody;
			if (apiType === 'azure') {
				requestBody = {
					messages: messages,
					max_tokens: max_tokens || 1000,
					temperature: temperature || 0.7
				};
			} else {
				requestBody = {
					model: model,
					messages: messages,
					max_tokens: max_tokens || 1000,
					temperature: temperature || 0.7
				};
			}

			// 选择HTTP或HTTPS
			const protocol = targetUrl.startsWith('https:') ? https : http;
			const parsedUrl = url.parse(targetUrl);

			const options = {
				hostname: parsedUrl.hostname,
				port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
				path: parsedUrl.path,
				method: 'POST',
				headers: headers
			};

			const proxyReq = protocol.request(options, (proxyRes) => {
				let responseBody = '';

				proxyRes.on('data', (chunk) => {
					responseBody += chunk;
				});

				proxyRes.on('end', () => {
					// 设置CORS头
					res.setHeader('Access-Control-Allow-Origin', '*');
					res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
					res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, api-key');

					res.writeHead(proxyRes.statusCode, {
						'Content-Type': 'application/json'
					});
					res.end(responseBody);
				});
			});

			proxyReq.on('error', (err) => {
				console.error('Proxy request error:', err);
				console.error('Target URL:', targetUrl);
				console.error('Request headers:', headers);
				res.writeHead(500);
				res.end(JSON.stringify({
					error: 'Proxy request failed',
					details: err.message,
					targetUrl: targetUrl
				}));
			});

			proxyReq.write(JSON.stringify(requestBody));
			proxyReq.end();

		} catch (error) {
			console.error('Error processing request:', error);
			res.writeHead(500);
			res.end(JSON.stringify({ error: 'Internal server error' }));
		}
	});
});

server.listen(PORT, () => {
	console.log(`🚀 AI代理服务器已启动！`);
	console.log(`🌐 监听端口: http://localhost:${PORT}`);
	console.log(`📡 代理端点: http://localhost:${PORT}/api/chat`);
	console.log(`⏹️  按 Ctrl+C 停止服务器`);
});

// 优雅关闭
process.on('SIGINT', () => {
	console.log('\n🛑 正在关闭AI代理服务器...');
	server.close(() => {
		console.log('✅ AI代理服务器已关闭');
		process.exit(0);
	});
});
