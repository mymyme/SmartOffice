// 自定义主题定义示例
import * as monaco from 'monaco-editor';

// 深色主题
export const darkCustomTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        // 注释
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'comment.doc', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '6A9955', fontStyle: 'italic' },
        
        // 关键字
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'keyword.operator', foreground: '569CD6' },
        { token: 'keyword.other', foreground: '569CD6' },
        
        // 字符串
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.quoted', foreground: 'CE9178' },
        { token: 'string.template', foreground: 'CE9178' },
        { token: 'string.escape', foreground: 'D7BA7D' },
        
        // 数字
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.hex', foreground: 'B5CEA8' },
        { token: 'number.octal', foreground: 'B5CEA8' },
        { token: 'number.float', foreground: 'B5CEA8' },
        
        // 标识符
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'variable.parameter', foreground: '9CDCFE' },
        { token: 'variable.other', foreground: '9CDCFE' },
        
        // 操作符
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'punctuation', foreground: 'D4D4D4' },
        
        // 类型
        { token: 'type', foreground: '4EC9B0' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        
        // 函数
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'function.name', foreground: 'DCDCAA' },
        
        // 类
        { token: 'class', foreground: '4EC9B0' },
        { token: 'class.name', foreground: '4EC9B0' },
        
        // 属性
        { token: 'property', foreground: '9CDCFE' },
        { token: 'property.name', foreground: '9CDCFE' },
        
        // 标签
        { token: 'tag', foreground: '569CD6' },
        { token: 'tag.name', foreground: '569CD6' },
        
        // 属性名
        { token: 'attribute.name', foreground: '92C5F8' },
        { token: 'attribute.value', foreground: 'CE9178' },
        
        // 正则表达式
        { token: 'regexp', foreground: 'D16969' },
        { token: 'regexp.escape', foreground: 'D16969' },
        
        // 错误
        { token: 'error', foreground: 'F44747', fontStyle: 'bold' },
        { token: 'warning', foreground: 'FFA500', fontStyle: 'bold' },
        
        // 信息
        { token: 'info', foreground: '75BEFF' },
        { token: 'hint', foreground: '75BEFF' },
        
        // 特殊
        { token: 'special', foreground: 'FFD700' },
        { token: 'brackets', foreground: 'FFD700' }
    ],
    colors: {
        // 编辑器背景
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        
        // 行号
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        
        // 选择
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editor.selectionHighlightBackground': '#add6ff26',
        
        // 光标
        'editorCursor.foreground': '#aeafad',
        'editorCursor.background': '#aeafad',
        
        // 空白字符
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        
        // 行高亮
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.lineHighlightBorder': '#282828',
        
        // 当前行
        'editorLineNumber.currentForeground': '#c6c6c6',
        
        // 折叠
        'editor.foldBackground': '#202d3a',
        
        // 查找匹配
        'editor.findMatchBackground': '#515c6a',
        'editor.findMatchHighlightBackground': '#ea5c0055',
        'editor.findRangeHighlightBackground': '#3a3d4166',
        
        // 悬停
        'editorHoverWidget.background': '#252526',
        'editorHoverWidget.border': '#454545',
        'editorHoverWidget.foreground': '#cccccc',
        
        // 建议
        'editorSuggestWidget.background': '#252526',
        'editorSuggestWidget.border': '#454545',
        'editorSuggestWidget.foreground': '#cccccc',
        'editorSuggestWidget.highlightForeground': '#0097fb',
        'editorSuggestWidget.selectedBackground': '#2c2c2d',
        
        // 错误和警告
        'editorError.foreground': '#f44747',
        'editorWarning.foreground': '#ffcc02',
        'editorInfo.foreground': '#75beff',
        'editorHint.foreground': '#75beff',
        
        // 状态栏
        'statusBar.background': '#007acc',
        'statusBar.foreground': '#ffffff',
        
        // 活动栏
        'activityBar.background': '#333333',
        'activityBar.foreground': '#ffffff',
        
        // 侧边栏
        'sideBar.background': '#252526',
        'sideBar.foreground': '#cccccc',
        
        // 面板
        'panel.background': '#1e1e1e',
        'panel.foreground': '#cccccc',
        
        // 输入框
        'input.background': '#3c3c3c',
        'input.foreground': '#cccccc',
        'input.border': '#454545',
        
        // 按钮
        'button.background': '#0e639c',
        'button.foreground': '#ffffff',
        'button.hoverBackground': '#1177bb',
        
        // 下拉菜单
        'dropdown.background': '#3c3c3c',
        'dropdown.foreground': '#cccccc',
        'dropdown.border': '#454545',
        
        // 列表
        'list.background': '#252526',
        'list.foreground': '#cccccc',
        'list.hoverBackground': '#2a2d2e',
        'list.activeSelectionBackground': '#094771',
        'list.activeSelectionForeground': '#ffffff',
        
        // 滚动条
        'scrollbar.shadow': '#000000',
        'scrollbarSlider.background': '#79797966',
        'scrollbarSlider.hoverBackground': '#646464b3',
        'scrollbarSlider.activeBackground': '#bfbfbf66'
    }
};

// 浅色主题
export const lightCustomTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
        // 注释
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'comment.doc', foreground: '008000', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '008000', fontStyle: 'italic' },
        
        // 关键字
        { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'af00db', fontStyle: 'bold' },
        { token: 'keyword.operator', foreground: '0000ff' },
        { token: 'keyword.other', foreground: '0000ff' },
        
        // 字符串
        { token: 'string', foreground: 'a31515' },
        { token: 'string.quoted', foreground: 'a31515' },
        { token: 'string.template', foreground: 'a31515' },
        { token: 'string.escape', foreground: 'a31515' },
        
        // 数字
        { token: 'number', foreground: '098658' },
        { token: 'number.hex', foreground: '098658' },
        { token: 'number.octal', foreground: '098658' },
        { token: 'number.float', foreground: '098658' },
        
        // 标识符
        { token: 'identifier', foreground: '001080' },
        { token: 'variable', foreground: '001080' },
        { token: 'variable.parameter', foreground: '001080' },
        { token: 'variable.other', foreground: '001080' },
        
        // 操作符
        { token: 'operator', foreground: '000000' },
        { token: 'delimiter', foreground: '000000' },
        { token: 'punctuation', foreground: '000000' },
        
        // 类型
        { token: 'type', foreground: '267f99' },
        { token: 'type.identifier', foreground: '267f99' },
        
        // 函数
        { token: 'function', foreground: '795e26' },
        { token: 'function.name', foreground: '795e26' },
        
        // 类
        { token: 'class', foreground: '267f99' },
        { token: 'class.name', foreground: '267f99' },
        
        // 属性
        { token: 'property', foreground: '001080' },
        { token: 'property.name', foreground: '001080' },
        
        // 标签
        { token: 'tag', foreground: '800000' },
        { token: 'tag.name', foreground: '800000' },
        
        // 属性名
        { token: 'attribute.name', foreground: 'ff0000' },
        { token: 'attribute.value', foreground: '0451a5' },
        
        // 正则表达式
        { token: 'regexp', foreground: 'd16969' },
        { token: 'regexp.escape', foreground: 'd16969' },
        
        // 错误
        { token: 'error', foreground: 'e51400', fontStyle: 'bold' },
        { token: 'warning', foreground: 'ff8c00', fontStyle: 'bold' },
        
        // 信息
        { token: 'info', foreground: '0078d4' },
        { token: 'hint', foreground: '0078d4' },
        
        // 特殊
        { token: 'special', foreground: 'ff8c00' },
        { token: 'brackets', foreground: 'ff8c00' }
    ],
    colors: {
        // 编辑器背景
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        
        // 行号
        'editorLineNumber.foreground': '#237893',
        'editorLineNumber.activeForeground': '#0b216f',
        
        // 选择
        'editor.selectionBackground': '#add6ff',
        'editor.inactiveSelectionBackground': '#e5ebf1',
        'editor.selectionHighlightBackground': '#add6ff26',
        
        // 光标
        'editorCursor.foreground': '#000000',
        'editorCursor.background': '#000000',
        
        // 空白字符
        'editorWhitespace.foreground': '#bfbfbf',
        'editorIndentGuide.background': '#d3d3d3',
        'editorIndentGuide.activeBackground': '#939393',
        
        // 行高亮
        'editor.lineHighlightBackground': '#f0f0f0',
        'editor.lineHighlightBorder': '#eeeeee',
        
        // 当前行
        'editorLineNumber.currentForeground': '#0b216f',
        
        // 折叠
        'editor.foldBackground': '#f3f3f3',
        
        // 查找匹配
        'editor.findMatchBackground': '#a8ac94',
        'editor.findMatchHighlightBackground': '#ea5c0055',
        'editor.findRangeHighlightBackground': '#e5ebf166',
        
        // 悬停
        'editorHoverWidget.background': '#f3f3f3',
        'editorHoverWidget.border': '#c1c1c1',
        'editorHoverWidget.foreground': '#616161',
        
        // 建议
        'editorSuggestWidget.background': '#f3f3f3',
        'editorSuggestWidget.border': '#c1c1c1',
        'editorSuggestWidget.foreground': '#616161',
        'editorSuggestWidget.highlightForeground': '#0078d4',
        'editorSuggestWidget.selectedBackground': '#e1e1e1',
        
        // 错误和警告
        'editorError.foreground': '#e51400',
        'editorWarning.foreground': '#ff8c00',
        'editorInfo.foreground': '#0078d4',
        'editorHint.foreground': '#0078d4',
        
        // 状态栏
        'statusBar.background': '#007acc',
        'statusBar.foreground': '#ffffff',
        
        // 活动栏
        'activityBar.background': '#2c2c2c',
        'activityBar.foreground': '#ffffff',
        
        // 侧边栏
        'sideBar.background': '#f3f3f3',
        'sideBar.foreground': '#616161',
        
        // 面板
        'panel.background': '#ffffff',
        'panel.foreground': '#616161',
        
        // 输入框
        'input.background': '#ffffff',
        'input.foreground': '#616161',
        'input.border': '#c1c1c1',
        
        // 按钮
        'button.background': '#0078d4',
        'button.foreground': '#ffffff',
        'button.hoverBackground': '#106ebe',
        
        // 下拉菜单
        'dropdown.background': '#ffffff',
        'dropdown.foreground': '#616161',
        'dropdown.border': '#c1c1c1',
        
        // 列表
        'list.background': '#ffffff',
        'list.foreground': '#616161',
        'list.hoverBackground': '#f5f5f5',
        'list.activeSelectionBackground': '#0078d4',
        'list.activeSelectionForeground': '#ffffff',
        
        // 滚动条
        'scrollbar.shadow': '#000000',
        'scrollbarSlider.background': '#c1c1c1',
        'scrollbarSlider.hoverBackground': '#a6a6a6',
        'scrollbarSlider.activeBackground': '#8a8886'
    }
};

// 高对比度主题
export const highContrastTheme: monaco.editor.IStandaloneThemeData = {
    base: 'hc-black',
    inherit: true,
    rules: [
        // 注释
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'comment.doc', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '6A9955', fontStyle: 'italic' },
        
        // 关键字
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'keyword.operator', foreground: '569CD6' },
        { token: 'keyword.other', foreground: '569CD6' },
        
        // 字符串
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.quoted', foreground: 'CE9178' },
        { token: 'string.template', foreground: 'CE9178' },
        { token: 'string.escape', foreground: 'D7BA7D' },
        
        // 数字
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.hex', foreground: 'B5CEA8' },
        { token: 'number.octal', foreground: 'B5CEA8' },
        { token: 'number.float', foreground: 'B5CEA8' },
        
        // 标识符
        { token: 'identifier', foreground: 'FFFFFF' },
        { token: 'variable', foreground: 'FFFFFF' },
        { token: 'variable.parameter', foreground: 'FFFFFF' },
        { token: 'variable.other', foreground: 'FFFFFF' },
        
        // 操作符
        { token: 'operator', foreground: 'FFFFFF' },
        { token: 'delimiter', foreground: 'FFFFFF' },
        { token: 'punctuation', foreground: 'FFFFFF' },
        
        // 类型
        { token: 'type', foreground: '4EC9B0' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        
        // 函数
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'function.name', foreground: 'DCDCAA' },
        
        // 类
        { token: 'class', foreground: '4EC9B0' },
        { token: 'class.name', foreground: '4EC9B0' },
        
        // 属性
        { token: 'property', foreground: 'FFFFFF' },
        { token: 'property.name', foreground: 'FFFFFF' },
        
        // 标签
        { token: 'tag', foreground: '569CD6' },
        { token: 'tag.name', foreground: '569CD6' },
        
        // 属性名
        { token: 'attribute.name', foreground: '92C5F8' },
        { token: 'attribute.value', foreground: 'CE9178' },
        
        // 正则表达式
        { token: 'regexp', foreground: 'D16969' },
        { token: 'regexp.escape', foreground: 'D16969' },
        
        // 错误
        { token: 'error', foreground: 'F44747', fontStyle: 'bold' },
        { token: 'warning', foreground: 'FFA500', fontStyle: 'bold' },
        
        // 信息
        { token: 'info', foreground: '75BEFF' },
        { token: 'hint', foreground: '75BEFF' },
        
        // 特殊
        { token: 'special', foreground: 'FFD700' },
        { token: 'brackets', foreground: 'FFD700' }
    ],
    colors: {
        // 编辑器背景
        'editor.background': '#000000',
        'editor.foreground': '#FFFFFF',
        
        // 行号
        'editorLineNumber.foreground': '#FFFFFF',
        'editorLineNumber.activeForeground': '#FFFFFF',
        
        // 选择
        'editor.selectionBackground': '#FFFFFF',
        'editor.inactiveSelectionBackground': '#FFFFFF',
        'editor.selectionHighlightBackground': '#FFFFFF',
        
        // 光标
        'editorCursor.foreground': '#FFFFFF',
        'editorCursor.background': '#FFFFFF',
        
        // 空白字符
        'editorWhitespace.foreground': '#FFFFFF',
        'editorIndentGuide.background': '#FFFFFF',
        'editorIndentGuide.activeBackground': '#FFFFFF',
        
        // 行高亮
        'editor.lineHighlightBackground': '#FFFFFF',
        'editor.lineHighlightBorder': '#FFFFFF',
        
        // 当前行
        'editorLineNumber.currentForeground': '#FFFFFF',
        
        // 折叠
        'editor.foldBackground': '#FFFFFF',
        
        // 查找匹配
        'editor.findMatchBackground': '#FFFFFF',
        'editor.findMatchHighlightBackground': '#FFFFFF',
        'editor.findRangeHighlightBackground': '#FFFFFF',
        
        // 悬停
        'editorHoverWidget.background': '#000000',
        'editorHoverWidget.border': '#FFFFFF',
        'editorHoverWidget.foreground': '#FFFFFF',
        
        // 建议
        'editorSuggestWidget.background': '#000000',
        'editorSuggestWidget.border': '#FFFFFF',
        'editorSuggestWidget.foreground': '#FFFFFF',
        'editorSuggestWidget.highlightForeground': '#FFFFFF',
        'editorSuggestWidget.selectedBackground': '#FFFFFF',
        
        // 错误和警告
        'editorError.foreground': '#F44747',
        'editorWarning.foreground': '#FFA500',
        'editorInfo.foreground': '#75BEFF',
        'editorHint.foreground': '#75BEFF',
        
        // 状态栏
        'statusBar.background': '#000000',
        'statusBar.foreground': '#FFFFFF',
        
        // 活动栏
        'activityBar.background': '#000000',
        'activityBar.foreground': '#FFFFFF',
        
        // 侧边栏
        'sideBar.background': '#000000',
        'sideBar.foreground': '#FFFFFF',
        
        // 面板
        'panel.background': '#000000',
        'panel.foreground': '#FFFFFF',
        
        // 输入框
        'input.background': '#000000',
        'input.foreground': '#FFFFFF',
        'input.border': '#FFFFFF',
        
        // 按钮
        'button.background': '#000000',
        'button.foreground': '#FFFFFF',
        'button.hoverBackground': '#FFFFFF',
        
        // 下拉菜单
        'dropdown.background': '#000000',
        'dropdown.foreground': '#FFFFFF',
        'dropdown.border': '#FFFFFF',
        
        // 列表
        'list.background': '#000000',
        'list.foreground': '#FFFFFF',
        'list.hoverBackground': '#FFFFFF',
        'list.activeSelectionBackground': '#FFFFFF',
        'list.activeSelectionForeground': '#000000',
        
        // 滚动条
        'scrollbar.shadow': '#000000',
        'scrollbarSlider.background': '#FFFFFF',
        'scrollbarSlider.hoverBackground': '#FFFFFF',
        'scrollbarSlider.activeBackground': '#FFFFFF'
    }
};

// 注册所有主题
export function registerCustomThemes() {
    if (typeof monaco === 'undefined') {
        console.error('Monaco Editor 未加载');
        return;
    }
    
    // 注册深色主题
    monaco.editor.defineTheme('darkCustom', darkCustomTheme);
    
    // 注册浅色主题
    monaco.editor.defineTheme('lightCustom', lightCustomTheme);
    
    // 注册高对比度主题
    monaco.editor.defineTheme('highContrastCustom', highContrastTheme);
    
    console.log('自定义主题已注册');
}

// 主题切换工具
export class ThemeManager {
    private currentTheme: string = 'vs';
    private themes: string[] = ['vs', 'vs-dark', 'darkCustom', 'lightCustom', 'highContrastCustom'];
    
    constructor(private editor: monaco.editor.IStandaloneCodeEditor) {
        this.registerThemes();
    }
    
    private registerThemes() {
        registerCustomThemes();
    }
    
    public getCurrentTheme(): string {
        return this.currentTheme;
    }
    
    public getAvailableThemes(): string[] {
        return this.themes;
    }
    
    public setTheme(theme: string): void {
        if (this.themes.includes(theme)) {
            this.currentTheme = theme;
            monaco.editor.setTheme(theme);
            console.log(`主题已切换到: ${theme}`);
        } else {
            console.warn(`未知主题: ${theme}`);
        }
    }
    
    public nextTheme(): void {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
    }
    
    public previousTheme(): void {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const previousIndex = currentIndex === 0 ? this.themes.length - 1 : currentIndex - 1;
        this.setTheme(this.themes[previousIndex]);
    }
}

// 使用示例
export function setupCustomThemes() {
    // 确保 Monaco Editor 已加载
    if (typeof monaco === 'undefined') {
        console.error('Monaco Editor 未加载');
        return;
    }
    
    // 注册主题
    registerCustomThemes();
    
    // 创建编辑器示例
    const container = document.getElementById('editor-container');
    if (container) {
        const editor = monaco.editor.create(container, {
            value: `// 自定义主题示例
function example() {
    const message = "Hello, Custom Themes!";
    console.log(message);
    return message;
}

// 支持多种主题切换
// 1. 默认主题 (vs, vs-dark)
// 2. 自定义深色主题 (darkCustom)
// 3. 自定义浅色主题 (lightCustom)
// 4. 高对比度主题 (highContrastCustom)

class ThemeExample {
    constructor() {
        this.theme = 'darkCustom';
    }
    
    switchTheme(newTheme) {
        this.theme = newTheme;
        monaco.editor.setTheme(newTheme);
    }
}`,
            language: 'javascript',
            theme: 'darkCustom',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            wordWrap: 'on',
            minimap: { enabled: true },
            lineNumbers: 'on'
        });
        
        // 创建主题管理器
        const themeManager = new ThemeManager(editor);
        
        // 添加主题切换按钮
        const themeButton = document.createElement('button');
        themeButton.textContent = '切换主题';
        themeButton.onclick = () => themeManager.nextTheme();
        document.body.appendChild(themeButton);
        
        console.log('自定义主题编辑器已创建');
        return { editor, themeManager };
    }
}

// 导出所有功能
export {
    darkCustomTheme,
    lightCustomTheme,
    highContrastTheme,
    registerCustomThemes,
    ThemeManager,
    setupCustomThemes
};
