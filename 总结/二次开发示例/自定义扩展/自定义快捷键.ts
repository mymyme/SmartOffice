// 自定义快捷键定义示例
import * as monaco from 'monaco-editor';

// 快捷键定义接口
interface CustomKeybinding {
    key: string;
    command: string;
    when?: string;
    description?: string;
}

// 自定义快捷键配置
export const customKeybindings: CustomKeybinding[] = [
    {
        key: 'ctrl+shift+f',
        command: 'editor.action.formatDocument',
        description: '格式化文档'
    },
    {
        key: 'ctrl+shift+s',
        command: 'custom.saveFile',
        description: '保存文件'
    },
    {
        key: 'ctrl+shift+n',
        command: 'custom.newFile',
        description: '新建文件'
    },
    {
        key: 'ctrl+shift+o',
        command: 'custom.openFile',
        description: '打开文件'
    },
    {
        key: 'ctrl+shift+p',
        command: 'custom.openCommandPalette',
        description: '打开命令面板'
    },
    {
        key: 'ctrl+shift+t',
        command: 'custom.toggleTheme',
        description: '切换主题'
    },
    {
        key: 'ctrl+shift+l',
        command: 'custom.toggleLanguage',
        description: '切换语言'
    },
    {
        key: 'ctrl+shift+m',
        command: 'custom.toggleMinimap',
        description: '切换小地图'
    },
    {
        key: 'ctrl+shift+r',
        command: 'custom.runCode',
        description: '运行代码'
    },
    {
        key: 'ctrl+shift+d',
        command: 'custom.debugCode',
        description: '调试代码'
    },
    {
        key: 'ctrl+shift+c',
        command: 'custom.clearConsole',
        description: '清空控制台'
    },
    {
        key: 'ctrl+shift+u',
        command: 'custom.uploadFile',
        description: '上传文件'
    },
    {
        key: 'ctrl+shift+e',
        command: 'custom.exportCode',
        description: '导出代码'
    },
    {
        key: 'ctrl+shift+i',
        command: 'custom.importCode',
        description: '导入代码'
    },
    {
        key: 'ctrl+shift+g',
        command: 'custom.toggleGit',
        description: '切换 Git 面板'
    },
    {
        key: 'ctrl+shift+b',
        command: 'custom.buildProject',
        description: '构建项目'
    },
    {
        key: 'ctrl+shift+x',
        command: 'custom.closeTab',
        description: '关闭当前标签'
    },
    {
        key: 'ctrl+shift+w',
        command: 'custom.closeAllTabs',
        description: '关闭所有标签'
    },
    {
        key: 'ctrl+shift+1',
        command: 'custom.splitEditor',
        description: '分割编辑器'
    },
    {
        key: 'ctrl+shift+2',
        command: 'custom.toggleSidebar',
        description: '切换侧边栏'
    }
];

// 自定义命令定义
export const customCommands: monaco.editor.ICommand[] = [
    {
        id: 'custom.saveFile',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const content = editor.getValue();
            console.log('保存文件:', content);
            // 这里可以添加实际的保存逻辑
            alert('文件已保存到控制台');
        }
    },
    {
        id: 'custom.newFile',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            editor.setValue('// 新文件\n// 开始编写您的代码...');
            console.log('新建文件');
        }
    },
    {
        id: 'custom.openFile',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.js,.ts,.html,.css,.json,.md';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const content = e.target?.result as string;
                        editor.setValue(content);
                        console.log('打开文件:', file.name);
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
    },
    {
        id: 'custom.openCommandPalette',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const commands = [
                '格式化文档',
                '保存文件',
                '新建文件',
                '打开文件',
                '切换主题',
                '切换语言',
                '运行代码',
                '调试代码'
            ];
            
            const command = prompt('选择命令:\n' + commands.map((cmd, i) => `${i + 1}. ${cmd}`).join('\n'));
            if (command) {
                const index = parseInt(command) - 1;
                if (index >= 0 && index < commands.length) {
                    console.log('执行命令:', commands[index]);
                    // 这里可以添加命令执行逻辑
                }
            }
        }
    },
    {
        id: 'custom.toggleTheme',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const currentTheme = editor.getOption(monaco.editor.EditorOption.theme);
            const newTheme = currentTheme === 'vs' ? 'vs-dark' : 'vs';
            monaco.editor.setTheme(newTheme);
            console.log('主题已切换到:', newTheme);
        }
    },
    {
        id: 'custom.toggleLanguage',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const languages = ['javascript', 'typescript', 'html', 'css', 'json', 'python', 'java'];
            const currentLanguage = editor.getModel()?.getLanguageId() || 'javascript';
            const currentIndex = languages.indexOf(currentLanguage);
            const nextIndex = (currentIndex + 1) % languages.length;
            const newLanguage = languages[nextIndex];
            
            monaco.editor.setModelLanguage(editor.getModel()!, newLanguage);
            console.log('语言已切换到:', newLanguage);
        }
    },
    {
        id: 'custom.toggleMinimap',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const currentMinimap = editor.getOption(monaco.editor.EditorOption.minimap);
            const newMinimap = !currentMinimap.enabled;
            editor.updateOptions({ minimap: { enabled: newMinimap } });
            console.log('小地图已', newMinimap ? '启用' : '禁用');
        }
    },
    {
        id: 'custom.runCode',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const code = editor.getValue();
            try {
                // 这里可以添加代码执行逻辑
                console.log('运行代码:', code);
                eval(code); // 注意：在生产环境中应该使用更安全的方法
                console.log('代码执行完成');
            } catch (error) {
                console.error('代码执行错误:', error);
            }
        }
    },
    {
        id: 'custom.debugCode',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const code = editor.getValue();
            console.log('开始调试代码:', code);
            // 这里可以添加调试逻辑
            debugger; // 触发调试器
        }
    },
    {
        id: 'custom.clearConsole',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.clear();
            console.log('控制台已清空');
        }
    },
    {
        id: 'custom.uploadFile',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) {
                    console.log('上传文件:', Array.from(files).map(f => f.name));
                    // 这里可以添加文件上传逻辑
                }
            };
            input.click();
        }
    },
    {
        id: 'custom.exportCode',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const code = editor.getValue();
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'code.txt';
            a.click();
            URL.revokeObjectURL(url);
            console.log('代码已导出');
        }
    },
    {
        id: 'custom.importCode',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.js,.ts,.html,.css,.json';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const content = e.target?.result as string;
                        editor.setValue(content);
                        console.log('代码已导入:', file.name);
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
    },
    {
        id: 'custom.toggleGit',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.log('切换 Git 面板');
            // 这里可以添加 Git 面板切换逻辑
        }
    },
    {
        id: 'custom.buildProject',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.log('开始构建项目...');
            // 这里可以添加项目构建逻辑
            setTimeout(() => {
                console.log('项目构建完成');
            }, 2000);
        }
    },
    {
        id: 'custom.closeTab',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.log('关闭当前标签');
            // 这里可以添加标签关闭逻辑
        }
    },
    {
        id: 'custom.closeAllTabs',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.log('关闭所有标签');
            // 这里可以添加所有标签关闭逻辑
        }
    },
    {
        id: 'custom.splitEditor',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.log('分割编辑器');
            // 这里可以添加编辑器分割逻辑
        }
    },
    {
        id: 'custom.toggleSidebar',
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            console.log('切换侧边栏');
            // 这里可以添加侧边栏切换逻辑
        }
    }
];

// 快捷键管理器
export class KeybindingManager {
    private editor: monaco.editor.IStandaloneCodeEditor;
    private keybindings: Map<string, string> = new Map();
    
    constructor(editor: monaco.editor.IStandaloneCodeEditor) {
        this.editor = editor;
        this.setupKeybindings();
    }
    
    private setupKeybindings() {
        // 注册自定义命令
        customCommands.forEach(command => {
            this.editor.addCommand(command.keybindings || [], command.run);
        });
        
        // 注册快捷键
        customKeybindings.forEach(keybinding => {
            this.keybindings.set(keybinding.key, keybinding.command);
            this.registerKeybinding(keybinding);
        });
    }
    
    private registerKeybinding(keybinding: CustomKeybinding) {
        const keyCode = this.parseKey(keybinding.key);
        if (keyCode) {
            this.editor.addCommand(keyCode, () => {
                this.executeCommand(keybinding.command);
            }, keybinding.when);
        }
    }
    
    private parseKey(key: string): monaco.KeyCode | monaco.KeyMod | null {
        const parts = key.toLowerCase().split('+');
        let keyCode = 0;
        
        for (const part of parts) {
            switch (part.trim()) {
                case 'ctrl':
                    keyCode |= monaco.KeyMod.CtrlCmd;
                    break;
                case 'shift':
                    keyCode |= monaco.KeyMod.Shift;
                    break;
                case 'alt':
                    keyCode |= monaco.KeyMod.Alt;
                    break;
                case 'meta':
                    keyCode |= monaco.KeyMod.WinCtrl;
                    break;
                default:
                    const key = this.getKeyCode(part);
                    if (key) {
                        keyCode |= key;
                    }
            }
        }
        
        return keyCode || null;
    }
    
    private getKeyCode(key: string): monaco.KeyCode | null {
        const keyMap: { [key: string]: monaco.KeyCode } = {
            'f': monaco.KeyCode.KeyF,
            's': monaco.KeyCode.KeyS,
            'n': monaco.KeyCode.KeyN,
            'o': monaco.KeyCode.KeyO,
            'p': monaco.KeyCode.KeyP,
            't': monaco.KeyCode.KeyT,
            'l': monaco.KeyCode.KeyL,
            'm': monaco.KeyCode.KeyM,
            'r': monaco.KeyCode.KeyR,
            'd': monaco.KeyCode.KeyD,
            'c': monaco.KeyCode.KeyC,
            'u': monaco.KeyCode.KeyU,
            'e': monaco.KeyCode.KeyE,
            'i': monaco.KeyCode.KeyI,
            'g': monaco.KeyCode.KeyG,
            'b': monaco.KeyCode.KeyB,
            'x': monaco.KeyCode.KeyX,
            'w': monaco.KeyCode.KeyW,
            '1': monaco.KeyCode.Digit1,
            '2': monaco.KeyCode.Digit2,
            'space': monaco.KeyCode.Space,
            'enter': monaco.KeyCode.Enter,
            'escape': monaco.KeyCode.Escape,
            'tab': monaco.KeyCode.Tab,
            'backspace': monaco.KeyCode.Backspace,
            'delete': monaco.KeyCode.Delete,
            'home': monaco.KeyCode.Home,
            'end': monaco.KeyCode.End,
            'pageup': monaco.KeyCode.PageUp,
            'pagedown': monaco.KeyCode.PageDown,
            'up': monaco.KeyCode.UpArrow,
            'down': monaco.KeyCode.DownArrow,
            'left': monaco.KeyCode.LeftArrow,
            'right': monaco.KeyCode.RightArrow
        };
        
        return keyMap[key] || null;
    }
    
    private executeCommand(commandId: string) {
        const command = customCommands.find(cmd => cmd.id === commandId);
        if (command) {
            command.run(this.editor);
        } else {
            console.warn(`未找到命令: ${commandId}`);
        }
    }
    
    public getKeybindings(): Map<string, string> {
        return new Map(this.keybindings);
    }
    
    public addKeybinding(key: string, command: string) {
        this.keybindings.set(key, command);
        const keybinding: CustomKeybinding = { key, command };
        this.registerKeybinding(keybinding);
    }
    
    public removeKeybinding(key: string) {
        this.keybindings.delete(key);
        // 注意：Monaco Editor 不提供直接移除快捷键的方法
        // 在实际应用中可能需要重新创建编辑器
    }
    
    public getHelpText(): string {
        let help = '快捷键帮助:\n\n';
        this.keybindings.forEach((command, key) => {
            const commandInfo = customCommands.find(cmd => cmd.id === command);
            const description = commandInfo?.description || command;
            help += `${key}: ${description}\n`;
        });
        return help;
    }
}

// 使用示例
export function setupCustomKeybindings() {
    // 确保 Monaco Editor 已加载
    if (typeof monaco === 'undefined') {
        console.error('Monaco Editor 未加载');
        return;
    }
    
    // 创建编辑器示例
    const container = document.getElementById('editor-container');
    if (container) {
        const editor = monaco.editor.create(container, {
            value: `// 自定义快捷键示例
// 按 Ctrl+Shift+F 格式化文档
// 按 Ctrl+Shift+S 保存文件
// 按 Ctrl+Shift+N 新建文件
// 按 Ctrl+Shift+O 打开文件
// 按 Ctrl+Shift+P 打开命令面板
// 按 Ctrl+Shift+T 切换主题
// 按 Ctrl+Shift+L 切换语言
// 按 Ctrl+Shift+M 切换小地图
// 按 Ctrl+Shift+R 运行代码
// 按 Ctrl+Shift+D 调试代码

function example() {
    const message = "Hello, Custom Keybindings!";
    console.log(message);
    return message;
}

// 尝试使用快捷键来操作编辑器
// 1. 格式化代码
// 2. 保存文件
// 3. 切换主题
// 4. 运行代码

class KeybindingExample {
    constructor() {
        this.setupKeybindings();
    }
    
    setupKeybindings() {
        // 这里可以添加自定义快捷键设置
    }
}`,
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            wordWrap: 'on',
            minimap: { enabled: true },
            lineNumbers: 'on'
        });
        
        // 创建快捷键管理器
        const keybindingManager = new KeybindingManager(editor);
        
        // 添加帮助按钮
        const helpButton = document.createElement('button');
        helpButton.textContent = '快捷键帮助';
        helpButton.onclick = () => {
            const help = keybindingManager.getHelpText();
            alert(help);
        };
        document.body.appendChild(helpButton);
        
        console.log('自定义快捷键编辑器已创建');
        return { editor, keybindingManager };
    }
}

// 导出所有功能
export {
    customKeybindings,
    customCommands,
    KeybindingManager,
    setupCustomKeybindings
};
