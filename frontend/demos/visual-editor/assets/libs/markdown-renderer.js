/**
 * 轻量级 Markdown 渲染器
 * 支持常用的 Markdown 语法
 */
(function(global) {
    'use strict';

    const MarkdownRenderer = {
        /**
         * 将 Markdown 文本转换为 HTML
         * @param {string} markdown - Markdown 文本
         * @returns {string} HTML 文本
         */
        parse: function(markdown) {
            if (!markdown || typeof markdown !== 'string') {
                return '';
            }

            let html = markdown;

            // 预处理：转义 HTML 特殊字符（在代码块外）
            html = this._escapeHtml(html);

            // 1. 处理代码块（```）
            html = this._parseCodeBlocks(html);

            // 2. 处理标题（# - ######）
            html = this._parseHeadings(html);

            // 3. 处理水平线（--- 或 ***）
            html = this._parseHorizontalRules(html);

            // 4. 处理引用（> ）
            html = this._parseBlockquotes(html);

            // 5. 处理列表（- 或 1. ）
            html = this._parseLists(html);

            // 6. 处理表格
            html = this._parseTables(html);

            // 7. 处理行内代码（`code`）
            html = this._parseInlineCode(html);

            // 8. 处理加粗（**text** 或 __text__）
            html = this._parseBold(html);

            // 9. 处理斜体（*text* 或 _text_）
            html = this._parseItalic(html);

            // 10. 处理删除线（~~text~~）
            html = this._parseStrikethrough(html);

            // 11. 处理链接（[text](url)）
            html = this._parseLinks(html);

            // 12. 处理图片（![alt](url)）
            html = this._parseImages(html);

            // 13. 处理段落
            html = this._parseParagraphs(html);

            // 14. 处理换行
            html = html.replace(/\n/g, '<br>');

            return html;
        },

        /**
         * 转义 HTML 特殊字符
         */
        _escapeHtml: function(text) {
            const htmlEscapes = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return text.replace(/[&<>"']/g, function(char) {
                return htmlEscapes[char];
            });
        },

        /**
         * 处理代码块
         */
        _parseCodeBlocks: function(text) {
            return text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
                lang = lang || 'plaintext';
                // 代码已经被转义，直接使用
                return '<pre><code class="language-' + lang + '">' + code.trim() + '</code></pre>';
            });
        },

        /**
         * 处理标题
         */
        _parseHeadings: function(text) {
            return text.replace(/^(#{1,6})\s+(.+)$/gm, function(match, hashes, content) {
                const level = hashes.length;
                return '<h' + level + '>' + content.trim() + '</h' + level + '>';
            });
        },

        /**
         * 处理水平线
         */
        _parseHorizontalRules: function(text) {
            return text.replace(/^(?:---+|\*\*\*+|___+)$/gm, '<hr>');
        },

        /**
         * 处理引用
         */
        _parseBlockquotes: function(text) {
            return text.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
        },

        /**
         * 处理列表
         */
        _parseLists: function(text) {
            // 无序列表
            text = text.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');
            text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

            // 有序列表
            text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
            // 注意：这里简化处理，可能会和无序列表的li冲突，实际使用时需要更复杂的逻辑

            return text;
        },

        /**
         * 处理表格
         */
        _parseTables: function(text) {
            const tableRegex = /^\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)*)/gm;
            return text.replace(tableRegex, function(match, header, rows) {
                const headers = header.split('|').map(h => h.trim()).filter(h => h);
                const rowArray = rows.trim().split('\n').map(row =>
                    row.split('|').map(cell => cell.trim()).filter(cell => cell)
                );

                let tableHtml = '<table class="markdown-table"><thead><tr>';
                headers.forEach(h => {
                    tableHtml += '<th>' + h + '</th>';
                });
                tableHtml += '</tr></thead><tbody>';

                rowArray.forEach(row => {
                    tableHtml += '<tr>';
                    row.forEach(cell => {
                        tableHtml += '<td>' + cell + '</td>';
                    });
                    tableHtml += '</tr>';
                });

                tableHtml += '</tbody></table>';
                return tableHtml;
            });
        },

        /**
         * 处理行内代码
         */
        _parseInlineCode: function(text) {
            return text.replace(/`([^`]+)`/g, '<code>$1</code>');
        },

        /**
         * 处理加粗
         */
        _parseBold: function(text) {
            return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/__(.+?)__/g, '<strong>$1</strong>');
        },

        /**
         * 处理斜体
         */
        _parseItalic: function(text) {
            return text.replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/_(.+?)_/g, '<em>$1</em>');
        },

        /**
         * 处理删除线
         */
        _parseStrikethrough: function(text) {
            return text.replace(/~~(.+?)~~/g, '<del>$1</del>');
        },

        /**
         * 处理链接
         */
        _parseLinks: function(text) {
            return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        },

        /**
         * 处理图片
         */
        _parseImages: function(text) {
            return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
        },

        /**
         * 处理段落
         */
        _parseParagraphs: function(text) {
            // 将连续的非空行包裹在 <p> 标签中
            // 跳过已经是HTML标签的行
            const lines = text.split('\n');
            let inParagraph = false;
            let result = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // 跳过空行和已有HTML标签的行
                if (!line || line.match(/^<(h\d|pre|ul|ol|li|blockquote|table|hr)/)) {
                    if (inParagraph) {
                        result.push('</p>');
                        inParagraph = false;
                    }
                    result.push(lines[i]);
                } else {
                    if (!inParagraph) {
                        result.push('<p>');
                        inParagraph = true;
                    }
                    result.push(lines[i]);
                }
            }

            if (inParagraph) {
                result.push('</p>');
            }

            return result.join('\n');
        },

        /**
         * 检测文本是否为 Markdown 格式
         * @param {string} text - 要检测的文本
         * @returns {boolean}
         */
        isMarkdown: function(text) {
            if (!text || typeof text !== 'string') {
                return false;
            }

            // 检测常见的 Markdown 语法特征
            const markdownPatterns = [
                /^#{1,6}\s+/m,              // 标题
                /^\*\*.*\*\*/m,             // 加粗
                /^__.*__/m,                 // 加粗
                /^\*.*\*/m,                 // 斜体
                /^_.*_/m,                   // 斜体
                /^\[.+\]\(.+\)/m,           // 链接
                /^!\[.*\]\(.+\)/m,          // 图片
                /^```/m,                    // 代码块
                /^[-*+]\s+/m,               // 无序列表
                /^\d+\.\s+/m,               // 有序列表
                /^>\s+/m,                   // 引用
                /^\|.+\|/m,                 // 表格
                /^---+$/m,                  // 水平线
            ];

            return markdownPatterns.some(pattern => pattern.test(text));
        }
    };

    // 导出到全局对象
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MarkdownRenderer;
    } else {
        global.MarkdownRenderer = MarkdownRenderer;
    }

})(typeof window !== 'undefined' ? window : this);

