/**
 * Word 样式映射模块
 * 将 CSS 样式映射为 Word (docx.js) 支持的格式
 */

(function() {
    'use strict';

    const StyleMapper = {
        /**
         * 获取文本对齐方式
         * @param {string} textAlign - CSS text-align 值
         * @returns {string} docx AlignmentType
         */
        getAlignment(textAlign) {
            const map = {
                'left': 'left',
                'center': 'center',
                'right': 'right',
                'justify': 'justified',
                'start': 'start',
                'end': 'end'
            };
            return map[textAlign] || 'left';
        },

        /**
         * 获取垂直对齐方式
         * @param {string} verticalAlign - CSS vertical-align 值
         * @returns {string} docx VerticalAlign
         */
        getVerticalAlignment(verticalAlign) {
            const map = {
                'top': 'top',
                'middle': 'center',
                'bottom': 'bottom',
                'center': 'center'
            };
            return map[verticalAlign] || 'center';
        },

        /**
         * 转换文本运行样式
         * @param {CSSStyleDeclaration} styles - 元素样式
         * @returns {Object} docx TextRun 样式对象
         */
        convertTextRunStyles(styles) {
            const textStyle = {
                font: this.getFontFamily(styles.fontFamily),
                size: WordExportUtils.halfPointsFromPx(styles.fontSize),
                color: WordExportUtils.rgbToHex(styles.color),
                bold: this.isBold(styles.fontWeight),
                italics: styles.fontStyle === 'italic',
            };

            // 下划线
            if (styles.textDecoration && styles.textDecoration.includes('underline')) {
                textStyle.underline = {
                    type: 'single',
                    color: WordExportUtils.rgbToHex(styles.color)
                };
            }

            // 删除线
            if (styles.textDecoration && styles.textDecoration.includes('line-through')) {
                textStyle.strike = true;
            }

            // 背景高亮
            const bgColor = WordExportUtils.rgbToHex(styles.backgroundColor);
            if (bgColor && bgColor !== 'FFFFFF' && bgColor !== '00000000') {
                textStyle.shading = {
                    type: 'clear',
                    fill: bgColor
                };
            }

            // 字符间距
            if (styles.letterSpacing && styles.letterSpacing !== 'normal') {
                textStyle.characterSpacing = WordExportUtils.twipsFromPx(styles.letterSpacing);
            }

            return textStyle;
        },

        /**
         * 转换段落样式
         * @param {CSSStyleDeclaration} styles - 元素样式
         * @returns {Object} docx Paragraph 样式对象
         */
        convertParagraphStyles(styles) {
            const paragraphStyle = {
                alignment: this.getAlignment(styles.textAlign),
            };

            // 间距
            paragraphStyle.spacing = {
                before: WordExportUtils.twipsFromPx(styles.marginTop),
                after: WordExportUtils.twipsFromPx(styles.marginBottom),
                line: this.getLineSpacing(styles.lineHeight, styles.fontSize)
            };

            // 缩进
            paragraphStyle.indent = {
                left: WordExportUtils.twipsFromPx(styles.paddingLeft),
                right: WordExportUtils.twipsFromPx(styles.paddingRight),
                firstLine: WordExportUtils.twipsFromPx(styles.textIndent)
            };

            // 边框
            const border = this.convertBorder(styles);
            if (border) {
                paragraphStyle.border = border;
            }

            // 背景色
            const shading = this.convertShading(styles.backgroundColor, styles.backgroundImage);
            if (shading) {
                paragraphStyle.shading = shading;
            }

            return paragraphStyle;
        },

        /**
         * 转换边框样式
         * @param {CSSStyleDeclaration} styles - 元素样式
         * @returns {Object|null} docx Border 对象
         */
        convertBorder(styles) {
            const borderWidth = WordExportUtils.parsePxValue(styles.borderWidth || styles.borderTopWidth);
            if (!borderWidth || borderWidth === 0) return null;

            const borderColor = WordExportUtils.rgbToHex(
                styles.borderColor || styles.borderTopColor || '#000000'
            );

            const borderStyle = {
                style: this.getBorderStyle(styles.borderStyle || styles.borderTopStyle),
                size: Math.max(1, Math.round(borderWidth * 8)), // pts to eighths of a point
                color: borderColor
            };

            return {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle
            };
        },

        /**
         * 获取边框样式类型
         * @param {string} cssStyle - CSS border-style 值
         * @returns {string} docx BorderStyle
         */
        getBorderStyle(cssStyle) {
            const map = {
                'solid': 'single',
                'dotted': 'dotted',
                'dashed': 'dashed',
                'double': 'double',
                'none': 'none'
            };
            return map[cssStyle] || 'single';
        },

        /**
         * 转换填充/背景色
         * @param {string} backgroundColor - CSS background-color
         * @param {string} backgroundImage - CSS background-image
         * @returns {Object|null} docx Shading 对象
         */
        convertShading(backgroundColor, backgroundImage) {
            let fillColor = null;

            // 优先处理渐变
            if (backgroundImage) {
                fillColor = WordExportUtils.extractGradientColor(backgroundImage);
            }

            // 如果没有渐变，使用纯色背景
            if (!fillColor && backgroundColor) {
                fillColor = WordExportUtils.rgbToHex(backgroundColor);
            }

            // 如果是白色或透明，不设置
            if (!fillColor || fillColor === 'FFFFFF' || fillColor === '00000000') {
                return null;
            }

            return {
                type: 'clear',
                fill: fillColor
            };
        },

        /**
         * 转换表格边框
         * @param {CSSStyleDeclaration} styles - 表格样式
         * @returns {Object} docx Table Borders
         */
        convertTableBorders(styles) {
            const borderWidth = WordExportUtils.parsePxValue(styles.borderWidth || '1px');
            const borderColor = WordExportUtils.rgbToHex(styles.borderColor || '#CCCCCC');

            const borderStyle = {
                style: 'single',
                size: Math.max(1, Math.round(borderWidth * 8)),
                color: borderColor
            };

            return {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle,
                insideHorizontal: borderStyle,
                insideVertical: borderStyle
            };
        },

        /**
         * 转换表格单元格边框
         * @param {CSSStyleDeclaration} styles - 单元格样式
         * @returns {Object} docx TableCell Borders
         */
        convertTableCellBorders(styles) {
            const borderWidth = WordExportUtils.parsePxValue(styles.borderWidth || '1px');
            const borderColor = WordExportUtils.rgbToHex(styles.borderColor || '#CCCCCC');

            const borderStyle = {
                style: 'single',
                size: Math.max(1, Math.round(borderWidth * 8)),
                color: borderColor
            };

            return {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle
            };
        },

        /**
         * 获取字体名称
         * @param {string} fontFamily - CSS font-family 值
         * @returns {string} 字体名称
         */
        getFontFamily(fontFamily) {
            if (!fontFamily) return 'Segoe UI';

            // 提取第一个字体名称，去除引号
            const fonts = fontFamily.split(',');
            let font = fonts[0].trim().replace(/['"]/g, '');

            // 映射常见字体
            const fontMap = {
                'sans-serif': 'Arial',
                'serif': 'Times New Roman',
                'monospace': 'Courier New',
                'cursive': 'Comic Sans MS',
                'fantasy': 'Impact'
            };

            return fontMap[font.toLowerCase()] || font;
        },

        /**
         * 判断是否为粗体
         * @param {string|number} fontWeight - CSS font-weight 值
         * @returns {boolean}
         */
        isBold(fontWeight) {
            if (typeof fontWeight === 'number') {
                return fontWeight >= 600;
            }
            if (typeof fontWeight === 'string') {
                if (fontWeight === 'bold' || fontWeight === 'bolder') return true;
                const weight = parseInt(fontWeight);
                return !isNaN(weight) && weight >= 600;
            }
            return false;
        },

        /**
         * 获取行高
         * @param {string} lineHeight - CSS line-height 值
         * @param {string} fontSize - CSS font-size 值
         * @returns {number} twips 值
         */
        getLineSpacing(lineHeight, fontSize) {
            if (!lineHeight || lineHeight === 'normal') {
                // 默认行高约为字体大小的 1.2 倍
                return Math.round(WordExportUtils.parsePxValue(fontSize) * 1.2 * 20);
            }

            // 如果是纯数字（倍数）
            const lineHeightNum = parseFloat(lineHeight);
            if (!isNaN(lineHeightNum) && lineHeight.indexOf('px') === -1) {
                return Math.round(WordExportUtils.parsePxValue(fontSize) * lineHeightNum * 20);
            }

            // 如果是像素值
            return WordExportUtils.twipsFromPx(lineHeight);
        },

        /**
         * 转换阴影为边框（降级处理）
         * @param {string} boxShadow - CSS box-shadow 值
         * @returns {Object|null} docx Border 对象
         */
        convertShadowToBorder(boxShadow) {
            if (!boxShadow || boxShadow === 'none') return null;

            // Word 不支持阴影，降级为淡灰色边框
            return {
                top: { style: 'single', size: 4, color: 'CCCCCC' },
                bottom: { style: 'single', size: 4, color: 'CCCCCC' },
                left: { style: 'single', size: 4, color: 'CCCCCC' },
                right: { style: 'single', size: 4, color: 'CCCCCC' }
            };
        },

        /**
         * 获取列表样式
         * @param {string} listStyleType - CSS list-style-type 值
         * @returns {Object} 列表配置
         */
        getListStyle(listStyleType) {
            const map = {
                'disc': { type: 'bullet', format: '●' },
                'circle': { type: 'bullet', format: '○' },
                'square': { type: 'bullet', format: '■' },
                'decimal': { type: 'number', format: 'decimal' },
                'lower-alpha': { type: 'number', format: 'lowerLetter' },
                'upper-alpha': { type: 'number', format: 'upperLetter' },
                'lower-roman': { type: 'number', format: 'lowerRoman' },
                'upper-roman': { type: 'number', format: 'upperRoman' }
            };

            return map[listStyleType] || { type: 'bullet', format: '●' };
        }
    };

    // 暴露到全局
    window.WordExportStyleMapper = StyleMapper;
})();

