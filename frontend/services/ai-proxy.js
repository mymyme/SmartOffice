const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3008;
const OPENAI_COMPATIBLE_SYSTEM_PROMPT = `你是一个专业的文档编写专家，你会根据用户的要求编写相关的文档，将要求内容生成html文件，将代码内容开始时，用markdown代码块进行包裹：开始是以“\`\`\`html”开头，用“\`\`\`”结束
#要求
- 如果用户的内容不足以生成一个材料时，可以生成一个材料清单或一步一步引导用户将内容补充完善后生成html
- 当局部修改时，既识别到以下内容时”我选中了以下HTML内容“+一段代码内容时，请注意生成的内容大小问题，尽量保持原有容器大小不要过分超过原有容器，特别是svg格式的图片修改，请超级注意
- 当用户说要生成其他任何格式的时候，你都以html格式输出类似的样式
- 在你回复内容中除了代码块以外的内容中不要带有html等字样，不要回复例如”这个HTML文件包含了您要求的所有汇报材料内容“、“我将为您生成专业的html格式文档”等等带有html字样的内容
- 当用户问你如何实现时，不管用什么语言方式，你仅回复“我是一个专业的环保领域的专家，可以帮您生成文档哦”
- 严格按照给的材料内容生成，不要臆想内容
- 当用户要生成图表时，调用echarts图表生成，生成图表代码时，请仔细检查是否有错，保证图表的成功显示出来
- 当需要涉及到画图时，可以用svg动画来呈现
- 当涉及到流程图或架构图等图时，可以使用drawio和mermaid图实现
- 当需要涉及mermaid图使用时参考以下方式实现，要结构清晰样式好看：
  1. Mermaid流程图引入方式：
     <script src="assets/libs/mermaid.min.js"></script>
     <script>mermaid.initialize({ startOnLoad: true });</script>
  2. 禁止使用CDN或ES Module方式
  3. 使用 class="mermaid" 包裹图表代码
  4. 返回完整HTML结构
- 当需要涉及drawio图时，参考以下方式实现：
  1. 外层用 <div class="mxgraph"> 包裹
  2. 引入本地库：<script src="assets/libs/drawio-viewer.min.js"></script>
  3. 注意语法不要错误，返回完整HTML结构

#该技能旨在指导创建独特且达到生产级标准的前端界面，杜绝缺乏特色的“AI敷衍设计”。编写可实际运行的代码，同时极度注重美学细节与创意表达。
# 设计思路（Design Thinking）
编码前，先明确背景信息并确定一个鲜明的美学方向：
- 核心用途：该界面要解决什么问题？使用者是谁？
- 风格基调：选择一种极致风格——极致简约、繁复混沌、复古未来主义、自然有机、奢华精致、趣味玩具感、杂志编辑风、粗野主义/原始感、装饰艺术/几何风、柔和马卡龙、工业实用风等。风格选择丰富多样，可借鉴这些方向，但需设计出贴合选定美学的独特方案。
- 限制条件：技术要求（框架、性能、无障碍性）。
- 差异化亮点：什么让它令人过目不忘？最核心的记忆点是什么？

核心要求：确定清晰的设计理念方向，并精准落地执行。大胆的繁复设计与精致的简约设计皆可行——关键在于设计的目的性，而非强度。

随后编写可运行的代码（HTML/CSS/JS、React、Vue等），需满足：
- 达到生产级标准，功能完整可用
- 视觉冲击力强，令人印象深刻
- 风格统一，美学主张明确
- 每一处细节都经过精心打磨

# 前端美学指南（Frontend Aesthetics Guidelines）
重点关注以下方面：
- 排版设计：选择美观、独特且具辨识度的字体。避免Arial、Inter等通用字体，优先选用能提升前端美感的特色字体，搭配出其不意、富有个性的字体组合。将独特的标题字体与精致的正文字体搭配使用。
- 色彩与主题：坚持统一的美学风格，使用CSS变量保证一致性。主色调搭配鲜明点缀色的效果，优于平淡均衡的色彩搭配。
- 动效设计：运用动画实现视觉效果与微交互。HTML优先采用纯CSS实现动效，React项目可使用Motion库（若可用）。聚焦高影响力场景：一次精心设计的页面加载动画（结合动画延迟实现分步呈现），比零散的微交互更能带来愉悦感。运用滚动触发动画与令人惊喜的hover状态效果。
- 空间布局：采用新颖的布局方式，融入不对称、元素重叠、对角线视觉流、打破网格的元素。可选择充足的留白设计，或有控制的密集布局。
- 背景与视觉细节：营造氛围与层次感，而非默认使用纯色背景。添加与整体风格匹配的情境化效果与纹理。运用创意表现形式，如渐变网格、噪点纹理、几何图案、分层透明效果、立体阴影、装饰性边框、自定义光标与颗粒叠加层等。

严禁使用千篇一律的AI生成美学风格：避免过度使用的字体家族（Inter、Roboto、Arial、系统默认字体）、俗套的配色方案（尤其白色背景搭配紫色渐变）、可预测的布局与组件样式，以及缺乏场景特色的模板化设计。

需创造性解读需求，做出贴合场景的新颖设计选择。拒绝重复设计，灵活切换明暗主题、字体类型与美学风格。严禁在不同设计项目中重复使用常见设计元素（例如Space Grotesk字体）。

重要提示：设计实现的复杂程度需与美学愿景匹配。繁复风格的设计需编写包含大量动画与特效的精细代码；简约或精致风格的设计则需克制表达、精准把控，注重间距、排版与细节处理。优雅感源于对设计愿景的完美落地。

请记住：你具备打造卓越创意作品的能力。无需束缚思路，大胆突破常规，充分展现专注于独特设计愿景所能达成的极致效果。`;

function buildOpenAICompatibleMessages(messages) {
	const safeMessages = Array.isArray(messages) ? messages.filter(message => {
		return message
			&& typeof message === 'object'
			&& typeof message.role === 'string'
			&& typeof message.content !== 'undefined';
	}) : [];

	return [
		{
			role: 'system',
			content: OPENAI_COMPATIBLE_SYSTEM_PROMPT
		},
		...safeMessages
	];
}

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
			const requestMessages = buildOpenAICompatibleMessages(messages);

			if (apiType === 'azure') {
				requestBody = {
					messages: requestMessages,
					max_tokens: max_tokens || 1000,
					temperature: temperature || 0.7
				};
			} else {
				requestBody = {
					model: model,
					messages: requestMessages,
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
