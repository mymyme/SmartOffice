import * as React from "react";
import { observer } from "mobx-react";
import { observable, action } from "mobx";

// 状态管理
class EditorState {
    @observable public code: string = '';
    @observable public language: string = 'javascript';
    @observable public theme: string = 'vs';
    @observable public readOnly: boolean = false;
    @observable public minimap: boolean = true;

    @action setCode(code: string) {
        this.code = code;
    }

    @action setLanguage(language: string) {
        this.language = language;
    }

    @action setTheme(theme: string) {
        this.theme = theme;
    }

    @action setReadOnly(readOnly: boolean) {
        this.readOnly = readOnly;
    }

    @action setMinimap(minimap: boolean) {
        this.minimap = minimap;
    }
}

// 编辑器组件
interface MonacoEditorProps {
    value: string;
    language: string;
    theme: string;
    readOnly?: boolean;
    minimap?: boolean;
    onChange?: (value: string) => void;
    onEditorReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

@observer
export class MonacoEditorComponent extends React.Component<MonacoEditorProps> {
    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private containerRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.createEditor();
    }

    componentWillUnmount() {
        this.disposeEditor();
    }

    componentDidUpdate(prevProps: MonacoEditorProps) {
        if (this.editor) {
            // 更新语言
            if (prevProps.language !== this.props.language) {
                monaco.editor.setModelLanguage(this.editor.getModel()!, this.props.language);
            }

            // 更新主题
            if (prevProps.theme !== this.props.theme) {
                monaco.editor.setTheme(this.props.theme);
            }

            // 更新只读状态
            if (prevProps.readOnly !== this.props.readOnly) {
                this.editor.updateOptions({ readOnly: this.props.readOnly });
            }

            // 更新小地图
            if (prevProps.minimap !== this.props.minimap) {
                this.editor.updateOptions({ minimap: { enabled: this.props.minimap } });
            }

            // 更新内容
            if (prevProps.value !== this.props.value && this.editor.getValue() !== this.props.value) {
                this.editor.setValue(this.props.value);
            }
        }
    }

    private createEditor() {
        if (!this.containerRef.current) return;

        // 创建编辑器
        this.editor = monaco.editor.create(this.containerRef.current, {
            value: this.props.value,
            language: this.props.language,
            theme: this.props.theme,
            readOnly: this.props.readOnly,
            minimap: { enabled: this.props.minimap },
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
        });

        // 监听内容变化
        this.editor.onDidChangeModelContent(() => {
            if (this.props.onChange) {
                this.props.onChange(this.editor!.getValue());
            }
        });

        // 通知编辑器已准备好
        if (this.props.onEditorReady) {
            this.props.onEditorReady(this.editor);
        }
    }

    private disposeEditor() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = undefined;
        }
    }

    // 公共方法
    public getEditor() {
        return this.editor;
    }

    public formatCode() {
        if (this.editor) {
            this.editor.getAction('editor.action.formatDocument')?.run();
        }
    }

    public getValue() {
        return this.editor?.getValue() || '';
    }

    public setValue(value: string) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    render() {
        return (
            <div 
                ref={this.containerRef} 
                style={{ 
                    height: '100%', 
                    width: '100%',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                }} 
            />
        );
    }
}

// 主应用组件
@observer
export class EditorApp extends React.Component {
    private editorState = new EditorState();
    private editorRef = React.createRef<MonacoEditorComponent>();

    componentDidMount() {
        // 设置默认代码
        this.editorState.setCode(`// 欢迎使用 Monaco Editor React 组件！
import React from 'react';

interface Props {
    name: string;
}

const MyComponent: React.FC<Props> = ({ name }) => {
    const [count, setCount] = React.useState(0);
    
    return (
        <div>
            <h1>Hello, {name}!</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
};

export default MyComponent;`);
    }

    handleCodeChange = (code: string) => {
        this.editorState.setCode(code);
    }

    handleLanguageChange = (language: string) => {
        this.editorState.setLanguage(language);
    }

    handleThemeChange = (theme: string) => {
        this.editorState.setTheme(theme);
    }

    handleFormat = () => {
        this.editorRef.current?.formatCode();
    }

    handleGetCode = () => {
        const code = this.editorRef.current?.getValue();
        console.log('当前代码:', code);
        alert('代码已输出到控制台');
    }

    handleSetCode = () => {
        const newCode = `// 新代码 - ${new Date().toLocaleTimeString()}
function newFunction() {
    return "这是新设置的代码";
}

console.log(newFunction());`;
        this.editorRef.current?.setValue(newCode);
    }

    render() {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* 头部 */}
                <div style={{ 
                    background: '#007acc', 
                    color: 'white', 
                    padding: '20px', 
                    textAlign: 'center' 
                }}>
                    <h1>Monaco Editor React 组件示例</h1>
                    <p>基于 React + MobX + Monaco Editor 的代码编辑器</p>
                </div>

                {/* 控制面板 */}
                <div style={{ 
                    padding: '20px', 
                    background: '#f8f9fa', 
                    borderBottom: '1px solid #ddd' 
                }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ marginRight: '10px' }}>语言:</label>
                            <select 
                                value={this.editorState.language}
                                onChange={(e) => this.handleLanguageChange(e.target.value)}
                                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ marginRight: '10px' }}>主题:</label>
                            <select 
                                value={this.editorState.theme}
                                onChange={(e) => this.handleThemeChange(e.target.value)}
                                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="vs">浅色主题</option>
                                <option value="vs-dark">深色主题</option>
                                <option value="hc-black">高对比度</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ marginRight: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={this.editorState.readOnly}
                                    onChange={(e) => this.editorState.setReadOnly(e.target.checked)}
                                />
                                只读模式
                            </label>
                        </div>

                        <div>
                            <label style={{ marginRight: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={this.editorState.minimap}
                                    onChange={(e) => this.editorState.setMinimap(e.target.checked)}
                                />
                                小地图
                            </label>
                        </div>

                        <div style={{ marginLeft: 'auto' }}>
                            <button 
                                onClick={this.handleFormat}
                                style={{ 
                                    background: '#007acc', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '8px 16px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                格式化
                            </button>
                            <button 
                                onClick={this.handleGetCode}
                                style={{ 
                                    background: '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '8px 16px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                获取代码
                            </button>
                            <button 
                                onClick={this.handleSetCode}
                                style={{ 
                                    background: '#ffc107', 
                                    color: 'black', 
                                    border: 'none', 
                                    padding: '8px 16px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer'
                                }}
                            >
                                设置代码
                            </button>
                        </div>
                    </div>
                </div>

                {/* 编辑器 */}
                <div style={{ flex: 1, padding: '20px' }}>
                    <MonacoEditorComponent
                        ref={this.editorRef}
                        value={this.editorState.code}
                        language={this.editorState.language}
                        theme={this.editorState.theme}
                        readOnly={this.editorState.readOnly}
                        minimap={this.editorState.minimap}
                        onChange={this.handleCodeChange}
                    />
                </div>
            </div>
        );
    }
}

export default EditorApp;
