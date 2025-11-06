// 自定义语言定义示例
import * as monaco from 'monaco-editor';

// 语言配置
export const myCustomLanguageConfig: monaco.languages.LanguageConfiguration = {
    // 注释配置
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
    },
    
    // 括号配置
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['<', '>']
    ],
    
    // 自动闭合对
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' }
    ],
    
    // 环绕对
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
    ],
    
    // 折叠配置
    folding: {
        markers: {
            start: new RegExp("^\\s*#region\\b"),
            end: new RegExp("^\\s*#endregion\\b")
        }
    }
};

// 语言定义（Monarch 语法）
export const myCustomLanguageDefinition: monaco.languages.IMonarchLanguage = {
    // 关键字
    keywords: [
        'function', 'if', 'else', 'for', 'while', 'return', 'let', 'const', 'var',
        'class', 'interface', 'type', 'import', 'export', 'from', 'as', 'default',
        'public', 'private', 'protected', 'static', 'abstract', 'extends', 'implements',
        'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'async', 'await'
    ],
    
    // 操作符
    operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '>>>=', '=>', '...', '?.', '??'
    ],
    
    // 符号
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    
    // 转义字符
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    
    // 词法分析器
    tokenizer: {
        root: [
            // 标识符和关键字
            [/[a-zA-Z_$][a-zA-Z0-9_$]*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@default': 'identifier'
                }
            }],
            
            // 空白字符
            [/\s+/, 'white'],
            
            // 注释
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
            
            // 字符串
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string_double'],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/'/, 'string', '@string_single'],
            [/`/, 'string', '@string_backtick'],
            
            // 数字
            [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
            [/0[xX][0-9a-fA-F]+[Ll]?/, 'number.hex'],
            [/0[0-7]+[Ll]?/, 'number.octal'],
            [/\d+[lL]?/, 'number'],
            
            // 分隔符
            [/[{}()\[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/@symbols/, {
                cases: {
                    '@operators': 'operator',
                    '@default': ''
                }
            }],
            
            // 分隔符和分号
            [/[;,.]/, 'delimiter'],
            
            // 正则表达式
            [/\/(?=.*\/)/, 'regexp', '@regexp']
        ],
        
        // 注释处理
        comment: [
            [/[^\/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
        ],
        
        // 双引号字符串
        string_double: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, 'string', '@pop']
        ],
        
        // 单引号字符串
        string_single: [
            [/[^\\']+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/'/, 'string', '@pop']
        ],
        
        // 反引号字符串（模板字符串）
        string_backtick: [
            [/[^\\`]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/\$\{/, 'string.template', '@string_template'],
            [/`/, 'string', '@pop']
        ],
        
        // 模板字符串插值
        string_template: [
            [/[^\\`$]+/, 'string.template'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/\$\{/, 'string.template', '@push'],
            [/\}/, 'string.template', '@pop'],
            [/`/, 'string', '@pop']
        ],
        
        // 正则表达式
        regexp: [
            [/[^\\\/\n]/, 'regexp'],
            [/@escapes/, 'regexp.escape'],
            [/\\./, 'regexp.escape.invalid'],
            [/\/[gimuy]*/, 'regexp', '@pop']
        ]
    }
};

// 主题配置
export const myCustomTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'regexp.escape', foreground: 'D16969' },
        { token: 'string.escape', foreground: 'D7BA7D' },
        { token: 'string.template', foreground: 'CE9178' },
        { token: 'brackets', foreground: 'FFD700' }
    ],
    colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorCursor.foreground': '#aeafad',
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070'
    }
};

// 代码补全提供者
export function createCompletionProvider() {
    return {
        provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => {
            const suggestions: monaco.languages.CompletionItem[] = [
                {
                    label: 'myFunction',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'myFunction(${1:param})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: '我的自定义函数',
                    detail: '自定义函数'
                },
                {
                    label: 'myVariable',
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: 'myVariable',
                    documentation: '我的自定义变量',
                    detail: '自定义变量'
                },
                {
                    label: 'myClass',
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: 'class MyClass {\n\t${1:constructor}() {\n\t\t${2:// constructor}\n\t}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: '我的自定义类',
                    detail: '自定义类'
                },
                {
                    label: 'if',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'if 语句',
                    detail: '控制流'
                },
                {
                    label: 'for',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// code}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'for 循环',
                    detail: '控制流'
                }
            ];

            return { suggestions };
        }
    };
}

// 悬停提供者
export function createHoverProvider() {
    return {
        provideHover: (model: monaco.editor.ITextModel, position: monaco.Position) => {
            const word = model.getWordAtPosition(position);
            if (word) {
                const hoverInfo = getHoverInfo(word.word);
                if (hoverInfo) {
                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [
                            { value: `**${word.word}**` },
                            { value: hoverInfo.description },
                            { value: `类型: ${hoverInfo.type}` }
                        ]
                    };
                }
            }
            return null;
        }
    };
}

// 悬停信息获取
function getHoverInfo(word: string): { description: string; type: string } | null {
    const hoverMap: Record<string, { description: string; type: string }> = {
        'myFunction': {
            description: '这是一个自定义函数，用于演示悬停功能',
            type: 'Function'
        },
        'myVariable': {
            description: '这是一个自定义变量，存储重要数据',
            type: 'Variable'
        },
        'myClass': {
            description: '这是一个自定义类，提供面向对象编程支持',
            type: 'Class'
        }
    };
    
    return hoverMap[word] || null;
}

// 注册自定义语言
export function registerMyCustomLanguage() {
    const languageId = 'myCustomLanguage';
    
    // 注册语言
    monaco.languages.register({ id: languageId });
    
    // 设置语言配置
    monaco.languages.setLanguageConfiguration(languageId, myCustomLanguageConfig);
    
    // 设置词法分析器
    monaco.languages.setMonarchTokensProvider(languageId, myCustomLanguageDefinition);
    
    // 注册主题
    monaco.editor.defineTheme('myCustomTheme', myCustomTheme);
    
    // 注册代码补全
    monaco.languages.registerCompletionItemProvider(languageId, createCompletionProvider());
    
    // 注册悬停提供者
    monaco.languages.registerHoverProvider(languageId, createHoverProvider());
    
    console.log(`自定义语言 "${languageId}" 已注册`);
}

// 使用示例
export function setupCustomLanguage() {
    // 确保 Monaco Editor 已加载
    if (typeof monaco === 'undefined') {
        console.error('Monaco Editor 未加载');
        return;
    }
    
    // 注册自定义语言
    registerMyCustomLanguage();
    
    // 创建编辑器示例
    const container = document.getElementById('editor-container');
    if (container) {
        const editor = monaco.editor.create(container, {
            value: `// 我的自定义语言示例
function myFunction(param) {
    let myVariable = "Hello, World!";
    console.log(myVariable);
    return param;
}

class myClass {
    constructor() {
        this.name = "MyClass";
    }
    
    greet() {
        return "Hello from " + this.name;
    }
}

// 使用示例
const instance = new myClass();
const result = myFunction(instance.greet());
console.log(result);`,
            language: 'myCustomLanguage',
            theme: 'myCustomTheme',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            wordWrap: 'on',
            minimap: { enabled: true },
            lineNumbers: 'on'
        });
        
        console.log('自定义语言编辑器已创建');
        return editor;
    }
}

// 导出所有功能
export {
    myCustomLanguageConfig,
    myCustomLanguageDefinition,
    myCustomTheme,
    createCompletionProvider,
    createHoverProvider,
    registerMyCustomLanguage,
    setupCustomLanguage
};
