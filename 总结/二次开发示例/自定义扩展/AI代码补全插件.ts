/**
 * Monaco Editor AI 代码补全插件
 * 集成 AI 大模型提供智能代码建议
 */

import * as monaco from 'monaco-editor';

// AI 代码补全配置接口
interface AICodeCompletionConfig {
	apiKey: string;
	model: string;
	maxTokens: number;
	temperature: number;
	baseUrl: string;
	apiType?: 'openai' | 'azure' | 'custom';
	headers?: Record<string, string>;
}

// 默认配置
const defaultConfig: AICodeCompletionConfig = {
	apiKey: '', // 需要用户提供 API Key
	model: 'gpt-3.5-turbo',
	maxTokens: 100,
	temperature: 0.7,
	baseUrl: 'https://api.openai.com/v1',
	apiType: 'openai',
	headers: {}
};

/**
 * AI 代码补全提供者类
 */
export class AICodeCompletionProvider implements monaco.languages.CompletionItemProvider {
	private config: AICodeCompletionConfig;
	private cache: Map<string, monaco.languages.CompletionItem[]> = new Map();

	constructor(config: Partial<AICodeCompletionConfig> = {}) {
		this.config = { ...defaultConfig, ...config };
	}

	get triggerCharacters(): string[] {
		return ['.', ' ', '\n', '\t', '(', '[', '{'];
	}

	async provideCompletionItems(
		model: monaco.editor.ITextModel,
		position: monaco.Position,
		context: monaco.languages.CompletionContext,
		token: monaco.CancellationToken
	): Promise<monaco.languages.CompletionList | undefined> {
		try {
			// 获取当前行和上下文
			const lineContent = model.getLineContent(position.lineNumber);
			const textBeforeCursor = lineContent.substring(0, position.column - 1);
			const textAfterCursor = lineContent.substring(position.column - 1);

			// 获取更多上下文（前5行和后2行）
			const startLine = Math.max(1, position.lineNumber - 5);
			const endLine = Math.min(model.getLineCount(), position.lineNumber + 2);
			const contextLines = [];

			for (let i = startLine; i <= endLine; i++) {
				contextLines.push(model.getLineContent(i));
			}

			const fullContext = contextLines.join('\n');

			// 生成缓存键
			const cacheKey = `${model.getLanguageId()}-${textBeforeCursor}-${position.lineNumber}`;

			// 检查缓存
			if (this.cache.has(cacheKey)) {
				return {
					suggestions: this.cache.get(cacheKey)!
				};
			}

			// 调用 AI API 获取代码建议
			const suggestions = await this.getAICodeSuggestions(
				fullContext,
				textBeforeCursor,
				textAfterCursor,
				model.getLanguageId(),
				position
			);

			// 缓存结果
			this.cache.set(cacheKey, suggestions);

			return {
				suggestions,
				incomplete: false
			};

		} catch (error) {
			console.error('AI 代码补全错误:', error);
			return { suggestions: [] };
		}
	}

	/**
	 * 调用 AI API 获取代码建议
	 */
	private async getAICodeSuggestions(
		context: string,
		textBefore: string,
		textAfter: string,
		language: string,
		position: monaco.Position
	): Promise<monaco.languages.CompletionItem[]> {
		const prompt = this.buildPrompt(context, textBefore, textAfter, language);

		try {
			const requestConfig = this.buildRequestConfig(prompt, language);
			const response = await fetch(requestConfig.url, requestConfig.options);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
			}

			const data = await response.json();
			const suggestions = this.parseAIResponse(data, textBefore, position);

			return suggestions;

		} catch (error) {
			console.error('AI API 调用失败:', error);
			return this.getFallbackSuggestions(language, textBefore);
		}
	}

	/**
	 * 构建API请求配置
	 */
	private buildRequestConfig(prompt: string, language: string) {
		const headers = {
			'Content-Type': 'application/json',
			...this.config.headers
		};

		// 根据API类型设置认证头
		switch (this.config.apiType) {
			case 'azure':
				headers['api-key'] = this.config.apiKey;
				break;
			case 'custom':
				headers['Authorization'] = `Bearer ${this.config.apiKey}`;
				break;
			case 'openai':
			default:
				headers['Authorization'] = `Bearer ${this.config.apiKey}`;
				break;
		}

		// 构建请求体
		let requestBody: any;
		switch (this.config.apiType) {
			case 'azure':
				requestBody = {
					messages: [
						{
							role: 'system',
							content: `你是一个专业的${language}代码助手。请根据上下文提供准确的代码补全建议。只返回代码片段，不要包含解释。`
						},
						{
							role: 'user',
							content: prompt
						}
					],
					max_tokens: this.config.maxTokens,
					temperature: this.config.temperature,
					stop: ['\n\n', '```']
				};
				break;
			case 'custom':
				// 自定义API格式，假设兼容OpenAI格式
				requestBody = {
					model: this.config.model,
					messages: [
						{
							role: 'system',
							content: `你是一个专业的${language}代码助手。请根据上下文提供准确的代码补全建议。只返回代码片段，不要包含解释。`
						},
						{
							role: 'user',
							content: prompt
						}
					],
					max_tokens: this.config.maxTokens,
					temperature: this.config.temperature,
					stop: ['\n\n', '```']
				};
				break;
			case 'openai':
			default:
				requestBody = {
					model: this.config.model,
					messages: [
						{
							role: 'system',
							content: `你是一个专业的${language}代码助手。请根据上下文提供准确的代码补全建议。只返回代码片段，不要包含解释。`
						},
						{
							role: 'user',
							content: prompt
						}
					],
					max_tokens: this.config.maxTokens,
					temperature: this.config.temperature,
					stop: ['\n\n', '```']
				};
				break;
		}

		// 构建URL
		let url: string;
		switch (this.config.apiType) {
			case 'azure':
				url = `${this.config.baseUrl}/chat/completions?api-version=2023-12-01-preview`;
				break;
			case 'custom':
			case 'openai':
			default:
				url = `${this.config.baseUrl}/chat/completions`;
				break;
		}

		return {
			url,
			options: {
				method: 'POST',
				headers,
				body: JSON.stringify(requestBody)
			}
		};
	}

	/**
	 * 构建 AI 提示词
	 */
	private buildPrompt(context: string, textBefore: string, textAfter: string, language: string): string {
		return `请为以下${language}代码提供补全建议：

\`\`\`${language}
${context}
\`\`\`

当前光标位置在：
- 光标前: "${textBefore}"
- 光标后: "${textAfter}"

请提供3-5个相关的代码补全建议，每个建议应该是完整的代码片段。`;
	}

	/**
	 * 解析 AI 响应
	 */
	private parseAIResponse(data: any, textBefore: string, position: monaco.Position): monaco.languages.CompletionItem[] {
		const suggestions: monaco.languages.CompletionItem[] = [];

		if (data.choices && data.choices.length > 0) {
			const content = data.choices[0].message.content;
			const lines = content.split('\n').filter(line => line.trim());

			lines.forEach((line, index) => {
				const trimmedLine = line.trim();
				if (trimmedLine && !trimmedLine.startsWith('```')) {
					suggestions.push({
						label: trimmedLine,
						kind: monaco.languages.CompletionItemKind.Snippet,
						insertText: trimmedLine,
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: `AI 建议 ${index + 1}`,
						detail: 'AI 代码补全',
						sortText: `ai_${index.toString().padStart(2, '0')}`,
						range: {
							startLineNumber: position.lineNumber,
							endLineNumber: position.lineNumber,
							startColumn: position.column,
							endColumn: position.column
						}
					});
				}
			});
		}

		return suggestions;
	}

	/**
	 * 获取备用建议（当 AI API 不可用时）
	 */
	private getFallbackSuggestions(language: string, textBefore: string): monaco.languages.CompletionItem[] {
		const fallbackSuggestions: { [key: string]: monaco.languages.CompletionItem[] } = {
			javascript: [
				{
					label: 'console.log()',
					kind: monaco.languages.CompletionItemKind.Function,
					insertText: 'console.log(${1:message})',
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					documentation: '输出调试信息到控制台',
					detail: '内置函数'
				},
				{
					label: 'function',
					kind: monaco.languages.CompletionItemKind.Snippet,
					insertText: 'function ${1:name}(${2:params}) {\n\t${3:// code}\n}',
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					documentation: '创建函数',
					detail: '语法结构'
				}
			],
			python: [
				{
					label: 'print()',
					kind: monaco.languages.CompletionItemKind.Function,
					insertText: 'print(${1:message})',
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					documentation: '输出信息到控制台',
					detail: '内置函数'
				},
				{
					label: 'def',
					kind: monaco.languages.CompletionItemKind.Snippet,
					insertText: 'def ${1:name}(${2:params}):\n\t${3:pass}',
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					documentation: '定义函数',
					detail: '语法结构'
				}
			]
		};

		return fallbackSuggestions[language] || [];
	}

	/**
	 * 更新配置
	 */
	updateConfig(newConfig: Partial<AICodeCompletionConfig>): void {
		this.config = { ...this.config, ...newConfig };
		this.cache.clear(); // 清空缓存
	}

	/**
	 * 清空缓存
	 */
	clearCache(): void {
		this.cache.clear();
	}
}

/**
 * 注册 AI 代码补全提供者
 */
export function registerAICodeCompletion(
	language: string,
	config: Partial<AICodeCompletionConfig> = {}
): monaco.IDisposable {
	const provider = new AICodeCompletionProvider(config);

	return monaco.languages.registerCompletionItemProvider(language, provider);
}

/**
 * 批量注册多种语言的 AI 代码补全
 */
export function registerAICodeCompletionForLanguages(
	languages: string[],
	config: Partial<AICodeCompletionConfig> = {}
): monaco.IDisposable[] {
	return languages.map(language =>
		registerAICodeCompletion(language, config)
	);
}

/**
 * AI 代码生成助手
 */
export class AICodeGenerator {
	private config: AICodeCompletionConfig;

	constructor(config: Partial<AICodeCompletionConfig> = {}) {
		this.config = { ...defaultConfig, ...config };
	}

	/**
	 * 生成代码
	 */
	async generateCode(
		prompt: string,
		language: string = 'javascript'
	): Promise<string> {
		try {
			const requestConfig = this.buildRequestConfig(prompt, language, true);
			const response = await fetch(requestConfig.url, requestConfig.options);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
			}

			const data = await response.json();
			return this.extractResponseContent(data);

		} catch (error) {
			console.error('AI 代码生成失败:', error);
			throw error;
		}
	}

	/**
	 * 构建API请求配置（用于代码生成）
	 */
	private buildRequestConfig(prompt: string, language: string, isGeneration: boolean = false) {
		const headers = {
			'Content-Type': 'application/json',
			...this.config.headers
		};

		// 根据API类型设置认证头
		switch (this.config.apiType) {
			case 'azure':
				headers['api-key'] = this.config.apiKey;
				break;
			case 'custom':
				headers['Authorization'] = `Bearer ${this.config.apiKey}`;
				break;
			case 'openai':
			default:
				headers['Authorization'] = `Bearer ${this.config.apiKey}`;
				break;
		}

		// 构建请求体
		let requestBody: any;
		const maxTokens = isGeneration ? this.config.maxTokens * 3 : this.config.maxTokens;

		switch (this.config.apiType) {
			case 'azure':
				requestBody = {
					messages: [
						{
							role: 'system',
							content: isGeneration
								? `你是一个专业的${language}代码生成助手。请根据用户需求生成完整、可运行的代码。`
								: `你是一个专业的${language}代码助手。请根据上下文提供准确的代码补全建议。只返回代码片段，不要包含解释。`
						},
						{
							role: 'user',
							content: prompt
						}
					],
					max_tokens: maxTokens,
					temperature: this.config.temperature,
					stop: isGeneration ? undefined : ['\n\n', '```']
				};
				break;
			case 'custom':
			case 'openai':
			default:
				requestBody = {
					model: this.config.model,
					messages: [
						{
							role: 'system',
							content: isGeneration
								? `你是一个专业的${language}代码生成助手。请根据用户需求生成完整、可运行的代码。`
								: `你是一个专业的${language}代码助手。请根据上下文提供准确的代码补全建议。只返回代码片段，不要包含解释。`
						},
						{
							role: 'user',
							content: prompt
						}
					],
					max_tokens: maxTokens,
					temperature: this.config.temperature,
					stop: isGeneration ? undefined : ['\n\n', '```']
				};
				break;
		}

		// 构建URL
		let url: string;
		switch (this.config.apiType) {
			case 'azure':
				url = `${this.config.baseUrl}/chat/completions?api-version=2023-12-01-preview`;
				break;
			case 'custom':
			case 'openai':
			default:
				url = `${this.config.baseUrl}/chat/completions`;
				break;
		}

		return {
			url,
			options: {
				method: 'POST',
				headers,
				body: JSON.stringify(requestBody)
			}
		};
	}

	/**
	 * 提取响应内容
	 */
	private extractResponseContent(data: any): string {
		if (data.choices && data.choices.length > 0) {
			return data.choices[0].message.content;
		}
		throw new Error('无效的API响应格式');
	}

	/**
	 * 解释代码
	 */
	async explainCode(code: string, language: string = 'javascript'): Promise<string> {
		const prompt = `请解释以下${language}代码的功能和实现原理：\n\n\`\`\`${language}\n${code}\n\`\`\``;
		return this.generateCode(prompt, 'markdown');
	}

	/**
	 * 优化代码
	 */
	async optimizeCode(code: string, language: string = 'javascript'): Promise<string> {
		const prompt = `请优化以下${language}代码，提高性能和可读性：\n\n\`\`\`${language}\n${code}\n\`\`\``;
		return this.generateCode(prompt, language);
	}
}

/**
 * 使用示例
 */
export function setupAICodeCompletion() {
	// 配置 AI 代码补全
	const aiConfig: Partial<AICodeCompletionConfig> = {
		apiKey: 'your-openai-api-key', // 替换为您的 API Key
		model: 'gpt-3.5-turbo',
		maxTokens: 150,
		temperature: 0.7
	};

	// 注册多种语言的 AI 代码补全
	const disposables = registerAICodeCompletionForLanguages(
		['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp'],
		aiConfig
	);

	// 创建 AI 代码生成器
	const codeGenerator = new AICodeGenerator(aiConfig);

	// 返回清理函数
	return () => {
		disposables.forEach(disposable => disposable.dispose());
	};
}

/**
 * 在 Monaco Editor 中集成 AI 功能的完整示例
 */
export function createAIEnhancedEditor(
	container: HTMLElement,
	options: monaco.editor.IStandaloneEditorConstructionOptions = {}
): monaco.editor.IStandaloneCodeEditor {
	// 创建编辑器
	const editor = monaco.editor.create(container, {
		value: '// 开始编写代码，AI 将为您提供智能建议\n',
		language: 'javascript',
		theme: 'vs-dark',
		automaticLayout: true,
		minimap: { enabled: true },
		...options
	});

	// 设置 AI 代码补全
	const cleanup = setupAICodeCompletion();

	// 添加 AI 代码生成按钮到编辑器
	const aiButton = document.createElement('button');
	aiButton.textContent = '🤖 AI 生成代码';
	aiButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        padding: 8px 16px;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

	aiButton.addEventListener('click', async () => {
		const prompt = prompt('请输入您想要生成的代码描述:');
		if (prompt) {
			try {
				const codeGenerator = new AICodeGenerator({
					apiKey: 'your-openai-api-key' // 替换为您的 API Key
				});
				const generatedCode = await codeGenerator.generateCode(prompt, 'javascript');
				editor.setValue(generatedCode);
			} catch (error) {
				alert('AI 代码生成失败: ' + error.message);
			}
		}
	});

	container.appendChild(aiButton);

	// 返回编辑器实例
	return editor;
}

export default {
	AICodeCompletionProvider,
	AICodeGenerator,
	registerAICodeCompletion,
	registerAICodeCompletionForLanguages,
	setupAICodeCompletion,
	createAIEnhancedEditor
};
