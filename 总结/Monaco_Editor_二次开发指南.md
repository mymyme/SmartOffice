# Monaco Editor 二次开发指南

## 项目概述

Monaco Editor 是 VS Code 的编辑器核心，提供了完整的代码编辑功能。本项目基于 Monaco Editor 构建了一个功能完整的 Web 应用，包括游乐场、文档、Monarch 语法工具等。

## 项目架构

### 技术栈
- **前端框架**: React 17.0.2 + TypeScript
- **状态管理**: MobX 5.15.4
- **构建工具**: Webpack 5.102.1
- **样式**: SCSS + Bootstrap 5.2.0
- **编辑器**: Monaco Editor 0.55.0-dev
- **UI 组件**: React Bootstrap 2.4.0

### 目录结构
```
/media/storage/project/aicode/
├── website/                    # 前端应用
│   ├── src/
│   │   ├── website/           # 主要前端代码
│   │   │   ├── components/    # React 组件
│   │   │   ├── pages/         # 页面组件
│   │   │   ├── data/          # 示例数据
│   │   │   └── utils/         # 工具函数
│   │   ├── runner/            # 预览运行器
│   │   └── monaco-loader.ts   # Monaco 加载器
│   ├── dist/                  # 构建输出
│   └── static/                # 静态资源
├── src/                       # Monaco Editor 源码
├── samples/                   # 示例代码
└── webpack-plugin/           # Webpack 插件
```

## 开发环境搭建

### 1. 环境要求
- Node.js 18.20.8+
- npm 10.8.2+
- 现代浏览器支持

### 2. 安装依赖
```bash
cd /media/storage/project/aicode/website
npm install --legacy-peer-deps
```

### 3. 开发模式启动
```bash
npm run dev
```

### 4. 生产构建
```bash
npx webpack --config webpack-simple.config.ts --mode production
```

## 核心组件分析

### 1. Monaco 编辑器组件

#### MonacoEditor.tsx
```typescript
// 基础编辑器组件
export class MonacoEditor extends React.Component<{
    model: monaco.editor.ITextModel;
    onEditorLoaded?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
    height?: MonacoEditorHeight;
    theme?: string;
    readOnly?: boolean;
    className?: string;
}> {
    // 编辑器实例
    public editor: monaco.editor.IStandaloneCodeEditor | undefined;
    
    // 渲染方法
    render() {
        return (
            <div ref={this.divRef} className={this.props.className}>
                {/* Monaco 编辑器容器 */}
            </div>
        );
    }
}
```

#### ControlledMonacoEditor.tsx
```typescript
// 受控编辑器组件
export class ControlledMonacoEditor extends React.Component<{
    value: string;
    onDidValueChange?: (newValue: string) => void;
    language?: string;
    theme?: string;
}> {
    private readonly model = getLoadedMonaco().editor.createModel(
        this.props.value,
        this.props.language
    );
    
    // 处理内容变化
    componentDidUpdate(lastProps: this["props"]) {
        if (this.props.value !== this.model.getValue()) {
            this.model.setValue(this.props.value);
        }
    }
}
```

### 2. 状态管理 (MobX)

#### PlaygroundModel.ts
```typescript
export class PlaygroundModel {
    @observable public html = "";
    @observable public js = "";
    @observable public css = "";
    @observable public reloadKey = 0;
    
    // 设置模型
    public readonly settings = new SettingsModel();
    
    // 计算属性
    @computed get previewState(): IPreviewState {
        return {
            html: this.html,
            js: this.js,
            css: this.css,
            reloadKey: this.reloadKey,
        };
    }
    
    // 动作方法
    @action setHtml(value: string) {
        this.html = value;
    }
}
```

#### SettingsModel.ts
```typescript
export class SettingsModel {
    @observable private _settings: Readonly<Settings>;
    
    get settings(): Readonly<Settings> {
        return this._settings;
    }
    
    @computed.struct get monacoSetup(): IMonacoSetup {
        return toLoaderConfig(this.settings);
    }
    
    @action setSettings(newSettings: Settings) {
        this._settings = newSettings;
        this.saveSettings();
    }
}
```

### 3. 页面组件

#### PlaygroundPageContent.tsx
```typescript
@observer
export class PlaygroundPageContent extends React.Component<{
    model: PlaygroundModel;
}> {
    render() {
        return (
            <Page>
                <SettingsDialog model={model} />
                <div className="p-2" style={{ height: "100%" }}>
                    <Row className="h-100 g-2">
                        <Col md>
                            <LabeledEditor label="JavaScript">
                                <Editor
                                    language="javascript"
                                    value={ref(model, "js")}
                                />
                            </LabeledEditor>
                        </Col>
                        <Col md>
                            <Preview model={model} />
                        </Col>
                    </Row>
                </div>
            </Page>
        );
    }
}
```

## 二次开发指南

### 1. 添加新页面

#### 步骤 1: 创建页面组件
```typescript
// src/website/pages/MyPage.tsx
import * as React from "react";
import { Page } from "../components/Page";

export class MyPage extends React.Component {
    render() {
        return (
            <Page>
                <div className="container-fluid">
                    <h1>我的页面</h1>
                    {/* 页面内容 */}
                </div>
            </Page>
        );
    }
}
```

#### 步骤 2: 添加路由
```typescript
// src/website/pages/routes.ts
export const myPage = {
    isActive: () => location.hash === "#mypage",
    activate: () => {
        location.hash = "#mypage";
    }
};
```

#### 步骤 3: 更新 App.tsx
```typescript
// src/website/pages/App.tsx
import { MyPage } from "./MyPage";

export class App extends React.Component {
    render() {
        if (myPage.isActive) {
            return <MyPage />;
        }
        // ... 其他页面
    }
}
```

### 2. 创建自定义编辑器组件

#### 基础编辑器组件
```typescript
// src/website/components/monaco/CustomEditor.tsx
import * as React from "react";
import { withLoadedMonaco } from "./MonacoLoader";

@withLoadedMonaco
export class CustomEditor extends React.Component<{
    value: string;
    language: string;
    onChange?: (value: string) => void;
    options?: monaco.editor.IStandaloneEditorConstructionOptions;
}> {
    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private model: monaco.editor.ITextModel | undefined;
    private divRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.createEditor();
    }

    componentWillUnmount() {
        this.disposeEditor();
    }

    private createEditor() {
        if (!this.divRef.current) return;

        // 创建模型
        this.model = monaco.editor.createModel(
            this.props.value,
            this.props.language
        );

        // 创建编辑器
        this.editor = monaco.editor.create(this.divRef.current, {
            model: this.model,
            ...this.props.options
        });

        // 监听内容变化
        this.model.onDidChangeContent(() => {
            if (this.props.onChange) {
                this.props.onChange(this.model!.getValue());
            }
        });
    }

    private disposeEditor() {
        this.editor?.dispose();
        this.model?.dispose();
    }

    render() {
        return <div ref={this.divRef} style={{ height: "400px" }} />;
    }
}
```

#### 高级编辑器组件
```typescript
// src/website/components/monaco/AdvancedEditor.tsx
@withLoadedMonaco
export class AdvancedEditor extends React.Component<{
    value: string;
    language: string;
    theme?: string;
    readOnly?: boolean;
    minimap?: boolean;
    lineNumbers?: boolean;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
}> {
    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private model: monaco.editor.ITextModel | undefined;

    componentDidMount() {
        this.createEditor();
        this.setupKeyboardShortcuts();
    }

    private createEditor() {
        this.model = monaco.editor.createModel(
            this.props.value,
            this.props.language
        );

        this.editor = monaco.editor.create(
            document.getElementById('editor-container')!,
            {
                model: this.model,
                theme: this.props.theme || 'vs',
                readOnly: this.props.readOnly || false,
                minimap: { enabled: this.props.minimap !== false },
                lineNumbers: this.props.lineNumbers !== false ? 'on' : 'off',
                automaticLayout: true,
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                selectOnLineNumbers: true,
                roundedSelection: false,
                cursorStyle: 'line',
                mouseWheelZoom: true
            }
        );

        // 监听内容变化
        this.model.onDidChangeContent(() => {
            if (this.props.onChange) {
                this.props.onChange(this.model!.getValue());
            }
        });
    }

    private setupKeyboardShortcuts() {
        if (!this.editor) return;

        // 添加自定义快捷键
        this.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                if (this.props.onSave) {
                    this.props.onSave(this.model!.getValue());
                }
            }
        );
    }

    render() {
        return <div id="editor-container" style={{ height: "100%" }} />;
    }
}
```

### 3. 添加新语言支持

#### 步骤 1: 创建语言定义
```typescript
// src/website/languages/myLanguage.ts
import * as monaco from 'monaco-editor';

// 语言配置
export const myLanguageConfig: monaco.languages.LanguageConfiguration = {
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
    ]
};

// 语言定义
export const myLanguageDefinition: monaco.languages.IMonarchLanguage = {
    tokenizer: {
        root: [
            [/[a-zA-Z_$][a-zA-Z0-9_$]*/, 'identifier'],
            [/\d+/, 'number'],
            [/"[^"]*"/, 'string'],
            [/\/\/.*$/, 'comment'],
            [/\/\*[\s\S]*?\*\//, 'comment']
        ]
    }
};

// 注册语言
export function registerMyLanguage() {
    monaco.languages.register({ id: 'myLanguage' });
    monaco.languages.setLanguageConfiguration('myLanguage', myLanguageConfig);
    monaco.languages.setMonarchTokensProvider('myLanguage', myLanguageDefinition);
}
```

#### 步骤 2: 在应用中使用
```typescript
// src/website/monaco-loader.ts
import { registerMyLanguage } from './languages/myLanguage';

export async function loadMonaco(setup: IMonacoSetup = prodMonacoSetup): Promise<typeof monaco> {
    // ... 现有代码
    
    // 注册自定义语言
    registerMyLanguage();
    
    return monaco;
}
```

### 4. 添加自定义主题

#### 创建主题
```typescript
// src/website/themes/myTheme.ts
import * as monaco from 'monaco-editor';

export const myTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'identifier', foreground: '9CDCFE' }
    ],
    colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
    }
};

export function registerMyTheme() {
    monaco.editor.defineTheme('myTheme', myTheme);
}
```

### 5. 添加自定义功能

#### 代码补全提供者
```typescript
// src/website/providers/completionProvider.ts
import * as monaco from 'monaco-editor';

export function registerCompletionProvider() {
    monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: (model, position) => {
            const suggestions: monaco.languages.CompletionItem[] = [
                {
                    label: 'myFunction',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'myFunction(${1:param})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: '我的自定义函数'
                },
                {
                    label: 'myVariable',
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: 'myVariable',
                    documentation: '我的自定义变量'
                }
            ];

            return { suggestions };
        }
    });
}
```

#### 悬停提供者
```typescript
// src/website/providers/hoverProvider.ts
import * as monaco from 'monaco-editor';

export function registerHoverProvider() {
    monaco.languages.registerHoverProvider('javascript', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (word) {
                return {
                    range: new monaco.Range(
                        position.lineNumber,
                        word.startColumn,
                        position.lineNumber,
                        word.endColumn
                    ),
                    contents: [
                        { value: `**${word.word}**` },
                        { value: '这是我的自定义悬停信息' }
                    ]
                };
            }
            return null;
        }
    });
}
```

### 6. 状态管理扩展

#### 创建新的状态模型
```typescript
// src/website/models/MyModel.ts
import { action, computed, observable } from 'mobx';

export class MyModel {
    @observable public data: string = '';
    @observable public loading: boolean = false;
    @observable public error: string | null = null;

    @computed get isValid() {
        return this.data.length > 0 && !this.error;
    }

    @action setData(value: string) {
        this.data = value;
        this.error = null;
    }

    @action setLoading(loading: boolean) {
        this.loading = loading;
    }

    @action setError(error: string | null) {
        this.error = error;
    }

    @action async fetchData() {
        this.setLoading(true);
        try {
            // 模拟 API 调用
            const response = await fetch('/api/data');
            const data = await response.text();
            this.setData(data);
        } catch (error) {
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }
}
```

### 7. 构建配置

#### Webpack 配置扩展
```typescript
// webpack-custom.config.ts
import * as webpack from "webpack";
import * as path from "path";

module.exports = {
    // ... 现有配置
    
    // 添加新的入口点
    entry: {
        index: path.resolve(__dirname, "src/website/index.tsx"),
        myPage: path.resolve(__dirname, "src/website/pages/MyPage.tsx"),
        // ... 其他入口点
    },
    
    // 添加新的插件
    plugins: [
        // ... 现有插件
        
        // 添加环境变量
        new webpack.DefinePlugin({
            'process.env.CUSTOM_FEATURE': JSON.stringify('enabled')
        }),
        
        // 添加新的 HTML 页面
        new HtmlWebpackPlugin({
            chunks: ["myPage"],
            filename: "mypage.html",
            templateContent: getHtml(),
        }),
    ],
    
    // 添加新的解析规则
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/website/components'),
            '@pages': path.resolve(__dirname, 'src/website/pages'),
            '@utils': path.resolve(__dirname, 'src/website/utils'),
        }
    }
};
```

## 开发最佳实践

### 1. 组件设计原则
- 使用 TypeScript 进行类型安全
- 遵循 React 最佳实践
- 使用 MobX 进行状态管理
- 保持组件的单一职责

### 2. 代码组织
- 按功能模块组织代码
- 使用绝对路径导入
- 保持文件结构清晰
- 添加适当的注释

### 3. 性能优化
- 使用 React.memo 优化渲染
- 合理使用 MobX 的 computed 和 action
- 避免不必要的重新渲染
- 使用懒加载减少初始包大小

### 4. 错误处理
- 使用 try-catch 处理异步操作
- 添加错误边界组件
- 提供用户友好的错误信息
- 记录错误日志

## 部署指南

### 1. 开发环境
```bash
cd /media/storage/project/aicode/website
npm run dev
```

### 2. 生产构建
```bash
npx webpack --config webpack-simple.config.ts --mode production
```

### 3. 启动服务器
```bash
cd /media/storage/project/aicode
node website-server.js
```

### 4. 访问应用
- 主页: http://localhost:3004/
- 游乐场: http://localhost:3004/playground.html
- 文档: http://localhost:3004/docs.html
- Monarch: http://localhost:3004/monarch.html

## 常见问题

### 1. 构建错误
- 检查 TypeScript 类型错误
- 确保所有依赖已安装
- 检查 webpack 配置

### 2. 运行时错误
- 检查浏览器控制台
- 确保 Monaco Editor 正确加载
- 检查组件 props 类型

### 3. 性能问题
- 使用 React DevTools 分析渲染
- 检查 MobX 状态更新
- 优化大型文件处理

## 扩展资源

### 1. 官方文档
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [React 文档](https://reactjs.org/docs)
- [MobX 文档](https://mobx.js.org/README.html)

### 2. 示例代码
- 查看 `samples/` 目录
- 参考现有组件实现
- 学习 playground 示例

### 3. 社区资源
- GitHub Issues
- Stack Overflow
- Monaco Editor 社区

## 总结

Monaco Editor 项目提供了完整的二次开发基础，包括：
- 现代化的 React + TypeScript 架构
- 强大的 Monaco Editor 集成
- 灵活的状态管理
- 可扩展的组件系统
- 完整的构建和部署流程

通过本指南，您可以：
- 快速上手项目开发
- 添加新功能和页面
- 自定义编辑器和主题
- 扩展状态管理
- 优化性能和用户体验

开始您的 Monaco Editor 二次开发之旅吧！
