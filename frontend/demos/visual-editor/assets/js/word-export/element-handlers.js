/**
 * Word 导出元素处理模块
 * 将各种 HTML 元素转换为 docx 元素
 *
 * 注意：此模块依赖 docx.js 库，使用时需确保 docx 对象已加载
 */

(function() {
    'use strict';

    const ElementHandlers = {
        /**
         * 转换节点为 docx 元素
         * @param {Node} node - DOM 节点
         * @param {Object} context - 上下文信息
         * @returns {Array|null} docx 元素数组
         */
        async convertNode(node, context = {}) {
            const type = node.nodeType;
            const tag = node.tagName?.toLowerCase();

            // 文本节点
            if (type === Node.TEXT_NODE) {
                return this.convertTextNode(node, context);
            }

            // 元素节点
            if (type === Node.ELEMENT_NODE) {
                const handler = this.getHandler(tag);
                if (handler) {
                    return await handler.call(this, node, context);
                }

                // 未知标签：递归处理子节点
                return await this.convertChildren(node, context);
            }

            return null;
        },

        /**
         * 获取元素处理器
         * @param {string} tag - 标签名
         * @returns {Function|null} 处理器函数
         */
        getHandler(tag) {
            const handlers = {
                'h1': this.convertHeading,
                'h2': this.convertHeading,
                'h3': this.convertHeading,
                'h4': this.convertHeading,
                'h5': this.convertHeading,
                'h6': this.convertHeading,
                'p': this.convertParagraph,
                'div': this.convertDiv,
                'span': this.convertSpan,
                'strong': this.convertBold,
                'b': this.convertBold,
                'em': this.convertItalic,
                'i': this.convertItalic,
                'u': this.convertUnderline,
                'ul': this.convertList,
                'ol': this.convertList,
                'li': this.convertListItem,
                'table': this.convertTable,
                'tr': this.convertTableRow,
                'td': this.convertTableCell,
                'th': this.convertTableHeader,
                'img': this.convertImage,
                'a': this.convertLink,
                'br': this.convertLineBreak,
                'hr': this.convertHorizontalRule,
                'pre': this.convertPreformatted,
                'code': this.convertCode,
                'blockquote': this.convertBlockquote
            };

            return handlers[tag] || null;
        },

        /**
         * 转换文本节点
         * @param {Text} node - 文本节点
         * @param {Object} context - 上下文
         * @returns {Array} TextRun 数组
         */
        convertTextNode(node, context) {
            const text = node.textContent;
            if (!text || !text.trim()) return [];

            const parent = node.parentElement;
            if (!parent) return [];

            const styles = WordExportUtils.getComputedStyle(parent);
            const textStyle = WordExportStyleMapper.convertTextRunStyles(styles);

            return [new docx.TextRun({
                text: text,
                ...textStyle
            })];
        },

        /**
         * 转换标题
         * @param {HTMLElement} node - 标题元素
         * @returns {Array} Paragraph 数组
         */
        async convertHeading(node) {
            const level = parseInt(node.tagName.substr(1)); // h1 → 1
            const styles = WordExportUtils.getComputedStyle(node);

            console.log(`[元素处理] 转换标题 h${level}`);

            // 字号根据级别递减
            const fontSize = level === 1 ? 32 : level === 2 ? 28 : level === 3 ? 24 :
                             level === 4 ? 22 : level === 5 ? 20 : 18;
            const color = WordExportUtils.rgbToHex(styles.color) || '2E74B5';

            // 递归处理子节点，但应用标题样式
            const children = await this.convertInlineContent(node, {
                bold: true,
                size: fontSize,
                color: color
            });

            const alignment = this.getAlignment(styles.textAlign);

            const paragraphConfig = {
                children: children,
                spacing: {
                    before: 240,
                    after: 120
                }
            };

            // 只在有效时添加对齐方式
            if (alignment) {
                paragraphConfig.alignment = alignment;
            }

            return [new docx.Paragraph(paragraphConfig)];
        },

        /**
         * 转换段落
         * @param {HTMLElement} node - 段落元素
         * @returns {Array} Paragraph 数组
         */
        async convertParagraph(node) {
            console.log('[元素处理] 转换段落');

            // 递归处理子节点，保留内联样式
            const children = await this.convertInlineContent(node);

            if (children.length === 0) {
                children.push(new docx.TextRun({ text: '' }));
            }

            const styles = WordExportUtils.getComputedStyle(node);
            const alignment = this.getAlignment(styles.textAlign);

            // 解析内联样式（用于背景色和边框）
            const inlineStyle = node.getAttribute('style') || '';
            const bgColorMatch = inlineStyle.match(/background-color:\s*([^;]+)/i);
            const borderMatch = inlineStyle.match(/border:\s*([^;]+)/i);

            let borderWidthValue = null;
            let borderColorValue = null;
            if (borderMatch) {
                const parts = borderMatch[1].trim().split(/\s+/);
                borderWidthValue = parts[0];
                if (parts.length > 2) {
                    borderColorValue = parts[2];
                }
            }

            // 段落配置
            const paragraphConfig = {
                children: children,
                spacing: {
                    after: 120
                }
            };

            // 只在有效时添加对齐方式
            if (alignment) {
                paragraphConfig.alignment = alignment;
            }

            // 背景色 - 优先使用内联样式
            const bgValue = (bgColorMatch ? bgColorMatch[1].trim() : null) || styles.backgroundColor || '';
            const backgroundColor = WordExportUtils.rgbToHex(bgValue);
            if (backgroundColor && backgroundColor !== 'FFFFFF') {
                // docx.js v7.8.2 只需要 fill 属性
                paragraphConfig.shading = {
                    fill: backgroundColor
                };
                console.log('[元素处理] 段落背景色:', backgroundColor, 'shading:', paragraphConfig.shading);
            }

            // 边框 - 优先使用内联样式
            const finalBorderWidth = borderWidthValue || styles.borderWidth || '0';
            const borderWidth = WordExportUtils.parsePxValue(finalBorderWidth);
            if (borderWidth > 0) {
                const finalBorderColor = borderColorValue || styles.borderColor || '';
                const borderColor = WordExportUtils.rgbToHex(finalBorderColor) || '000000';
                const borderSize = Math.max(6, Math.round(borderWidth * 8));  // 至少 6 eighths

                // docx.js 边框定义
                const borderDef = {
                    style: docx.BorderStyle.SINGLE,
                    size: borderSize,
                    color: borderColor
                };

                paragraphConfig.border = {
                    top: borderDef,
                    bottom: borderDef,
                    left: borderDef,
                    right: borderDef
                };

                // 内边距（通过缩进模拟）
                const padding = WordExportUtils.parsePxValue(styles.padding || styles.paddingLeft || '0');
                if (padding > 0) {
                    paragraphConfig.indent = {
                        left: Math.round(padding * 15),   // px to twips
                        right: Math.round(padding * 15)
                    };
                }

                console.log('[元素处理] 段落边框:', {
                    inline: borderMatch ? borderMatch[1] : 'null',
                    parsedWidth: borderWidthValue || 'null',
                    parsedColor: borderColorValue || 'null',
                    finalColor: borderColor,
                    finalWidth: borderWidth + 'px',
                    size: borderSize
                });
            }

            return [new docx.Paragraph(paragraphConfig)];
        },

        /**
         * 转换 div
         * @param {HTMLElement} node - div 元素
         * @returns {Array} docx 元素数组
         */
        async convertDiv(node) {
            console.log('[元素处理] 转换 div');
            // 检查是否是Mermaid或SVG图表容器
            if (node.classList && (node.classList.contains("mermaid") || node.classList.contains("mxgraph") || node.classList.contains("diagram-container"))) {
                const diagramImage = node.getAttribute("data-diagram-image");
                if (diagramImage) {
                    console.log("[元素处理] 检测到Mermaid/SVG图表，使用预提取的图片数据");
                    try {
                        const diagramWidth = parseInt(node.getAttribute("data-diagram-width")) || 600;
                        const diagramHeight = parseInt(node.getAttribute("data-diagram-height")) || 400;
                        const diagramType = node.getAttribute("data-diagram-type") || "diagram";
                        
                        console.log("[元素处理] 图表信息: 类型=" + diagramType + ", 宽度=" + diagramWidth + ", 高度=" + diagramHeight);
                        
                        // 将base64图片转换为Word图片
                        const imageData = diagramImage.split(",")[1];
                        const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
                        
                        return [new docx.Paragraph({
                            children: [
                                new docx.ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: Math.min(diagramWidth, 600),
                                        height: Math.min(diagramHeight, 450)
                                    }
                                })
                            ],
                            spacing: { after: 200 }
                        })];
                    } catch (error) {
                        console.error("[元素处理] Mermaid/SVG图表转换失败:", error);
                        return [new docx.Paragraph({
                            children: [new docx.TextRun({
                                text: "[图表转换错误: " + error.message + "]",
                                color: "FF0000"
                            })]
                        })];
                    }
                }
            }
            
            

            try {
                // 检查是否包含块级元素
                const hasBlockElements = Array.from(node.children).some(child => {
                    const tag = child.tagName?.toLowerCase();
                    return ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table'].includes(tag);
                });

                if (hasBlockElements) {
                    // 包含块级元素，递归处理子元素
                    const results = [];
                    for (const child of node.childNodes) {
                        const converted = await this.convertNode(child);
                        if (converted && Array.isArray(converted)) {
                            results.push(...converted);
                        }
                    }
                    return results;
                } else {
                    // 只包含内联内容，作为段落处理
                    const children = await this.convertInlineContent(node);

                    // 检查是否有有效内容
                    if (children.length === 0) {
                        console.log('[元素处理] div 内容为空，跳过');
                        return [];
                    }

                    const styles = WordExportUtils.getComputedStyle(node);
                    const alignment = this.getAlignment(styles.textAlign);

                    const paragraphConfig = {
                        children: children,
                        spacing: { after: 120 }
                    };

                    // 只在有效时添加对齐方式
                    if (alignment) {
                        paragraphConfig.alignment = alignment;
                    }

                    return [new docx.Paragraph(paragraphConfig)];
                }
            } catch (error) {
                console.error('[元素处理] div 转换失败:', error);
                console.error('[元素处理] div 内容:', node.innerHTML?.substring(0, 100));
                // 返回错误占位符
                return [new docx.Paragraph({
                    children: [new docx.TextRun({
                        text: "[div转换错误: " + error.message + "]",
                        color: 'FF0000'
                    })]
                })];
            }
        },

        /**
         * 转换 span（内联元素）
         * @param {HTMLElement} node - span 元素
         * @returns {Array} TextRun 数组
         */
        async convertSpan(node) {
            return await this.convertInlineContent(node);
        },

        /**
         * 转换粗体
         * @param {HTMLElement} node - 粗体元素
         * @returns {Array} TextRun 数组
         */
        async convertBold(node) {
            const text = node.textContent;
            const styles = WordExportUtils.getComputedStyle(node);
            const textStyle = WordExportStyleMapper.convertTextRunStyles(styles);

            return [new docx.TextRun({
                text: text,
                bold: true,
                ...textStyle
            })];
        },

        /**
         * 转换斜体
         * @param {HTMLElement} node - 斜体元素
         * @returns {Array} TextRun 数组
         */
        async convertItalic(node) {
            const text = node.textContent;
            const styles = WordExportUtils.getComputedStyle(node);
            const textStyle = WordExportStyleMapper.convertTextRunStyles(styles);

            return [new docx.TextRun({
                text: text,
                italics: true,
                ...textStyle
            })];
        },

        /**
         * 转换下划线
         * @param {HTMLElement} node - 下划线元素
         * @returns {Array} TextRun 数组
         */
        async convertUnderline(node) {
            const text = node.textContent;
            const styles = WordExportUtils.getComputedStyle(node);
            const textStyle = WordExportStyleMapper.convertTextRunStyles(styles);

            return [new docx.TextRun({
                text: text,
                underline: { type: docx.UnderlineType.SINGLE },
                ...textStyle
            })];
        },

        /**
         * 转换列表
         * @param {HTMLElement} node - 列表元素
         * @param {Object|number} contextOrLevel - 上下文对象或层级数字
         * @returns {Array} Paragraph 数组
         */
        async convertList(node, contextOrLevel = 0) {
            // 兼容两种调用方式：convertList(node, level) 或 convertList(node, context)
            let level = 0;
            if (typeof contextOrLevel === 'number') {
                level = contextOrLevel;
            } else if (contextOrLevel && typeof contextOrLevel.level === 'number') {
                level = contextOrLevel.level;
            }

            // 确保 level 是有效数字
            if (isNaN(level) || level < 0) {
                level = 0;
            }

            const isOrdered = node.tagName.toLowerCase() === 'ol';
            console.log(`[元素处理] 转换列表 (${isOrdered ? '有序' : '无序'}, 层级 ${level})`);

            const results = [];
            const items = Array.from(node.children).filter(child =>
                child.tagName?.toLowerCase() === 'li'
            );

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // 检查是否有嵌套列表
                const nestedList = item.querySelector('ul, ol');

                if (nestedList) {
                    // 先提取直接文本内容（不包括嵌套列表的文本）
                    const directText = Array.from(item.childNodes)
                        .filter(child => child !== nestedList &&
                                (child.nodeType === Node.TEXT_NODE ||
                                 !['ul', 'ol'].includes(child.tagName?.toLowerCase())))
                        .map(child => child.textContent)
                        .join('');

                    if (directText.trim()) {
                        const children = [new docx.TextRun({ text: directText })];

                        const paragraphConfig = {
                            children: children,
                            spacing: { after: 80 }
                        };

                        // 添加缩进（所有层级都需要）
                        // 每层缩进 720 twips (0.5 inch)，基础缩进 360 twips (0.25 inch)
                        const indentLeft = level * 720 + 360;
                        paragraphConfig.indent = {
                            left: indentLeft,
                            hanging: 360
                        };
                        console.log(`[元素处理] 列表项缩进: level=${level}, left=${indentLeft} twips`);

                        // 无序列表使用项目符号
                        if (!isOrdered) {
                            paragraphConfig.bullet = { level: Math.min(level, 2) };
                        }

                        results.push(new docx.Paragraph(paragraphConfig));
                    }

                    // 递归处理嵌套列表
                    const nestedResults = await this.convertList(nestedList, level + 1);
                    results.push(...nestedResults);

                } else {
                    // 没有嵌套列表，正常处理
                    console.log(`[元素处理] 列表项 ${i + 1}`);

                    const children = await this.convertInlineContent(item);

                    if (children.length > 0) {
                        // 每层缩进 720 twips (0.5 inch)，基础缩进 360 twips (0.25 inch)
                        const indentLeft = level * 720 + 360;
                        const paragraphConfig = {
                            children: children,
                            spacing: { after: 80 },
                            indent: {
                                left: indentLeft,
                                hanging: 360
                            }
                        };
                        console.log(`[元素处理] 列表项缩进: level=${level}, left=${indentLeft} twips`);

                        if (isOrdered) {
                            // 有序列表：添加编号前缀
                            const prefix = `${i + 1}. `;
                            children.unshift(new docx.TextRun({ text: prefix }));
                        } else {
                            // 无序列表：使用项目符号
                            paragraphConfig.bullet = { level: Math.min(level, 2) };  // 最多3层
                        }

                        results.push(new docx.Paragraph(paragraphConfig));
                    }
                }
            }

            return results;
        },

        /**
         * 转换列表项
         * @param {HTMLElement} node - 列表项元素
         * @returns {Array} Paragraph 数组
         */
        async convertListItem(node) {
            // 通常由 convertList 处理，这里作为后备
            return await this.convertParagraph(node);
        },

        /**
         * 转换表格
         * @param {HTMLElement} node - 表格元素
         * @returns {Array} Table 数组
         */
        async convertTable(node) {
            console.log('[元素处理] 转换表格');
            const rows = [];

            // 处理所有行
            const trElements = node.querySelectorAll('tr');
            for (const tr of trElements) {
                const cells = [];
                const tdElements = tr.querySelectorAll('td, th');

                for (const cell of tdElements) {
                    const isHeader = cell.tagName.toLowerCase() === 'th';
                    const styles = WordExportUtils.getComputedStyle(cell);

                    // 备用：直接从 style 属性获取
                    const cellStyle = cell.getAttribute('style') || '';
                    let bgColorMatch = cellStyle.match(/background-color:\s*([^;]+)/i);

                    // 如果单元格没有背景色，检查父 <tr>
                    if (!bgColorMatch && cell.parentElement) {
                        const rowStyle = cell.parentElement.getAttribute('style') || '';
                        bgColorMatch = rowStyle.match(/background-color:\s*([^;]+)/i);
                    }

                    // 解析 border 简写属性（如 "1px solid #ddd"）
                    let borderColorMatch = cellStyle.match(/border-color:\s*([^;]+)/i);
                    let borderWidthValue = null;
                    const borderShorthand = cellStyle.match(/border:\s*([^;]+)/i);
                    if (borderShorthand) {
                        const borderParts = borderShorthand[1].trim().split(/\s+/);
                        // border: 1px solid #ddd -> ["1px", "solid", "#ddd"]
                        borderWidthValue = borderParts[0];
                        if (borderParts.length > 2) {
                            borderColorMatch = [null, borderParts[2]];
                        }
                    }

                    console.log('[元素处理] 单元格 (行样式:', cell.parentElement?.getAttribute('style'), ')');
                    console.log('[元素处理] 解析结果:', {
                        cellBg: bgColorMatch ? bgColorMatch[1] : 'null',
                        border: borderShorthand ? borderShorthand[1] : 'null',
                        borderWidth: borderWidthValue || 'null',
                        borderColor: borderColorMatch ? borderColorMatch[1] : 'null'
                    });

                    // 递归处理单元格内容，保留格式
                    const children = await this.convertInlineContent(cell, {
                        bold: isHeader,
                        color: isHeader ? 'FFFFFF' : undefined  // 表头白色文字
                    });

                    const alignment = this.getAlignment(styles.textAlign);

                    // 背景色 - 优先使用内联样式
                    const bgColorValue = (bgColorMatch ? bgColorMatch[1].trim() : null) || styles.backgroundColor || '';
                    const backgroundColor = WordExportUtils.rgbToHex(bgColorValue);

                    // 段落配置
                    const paragraphConfig = {
                        children: children
                    };

                    // 只在有效时添加对齐方式
                    if (alignment) {
                        paragraphConfig.alignment = alignment;
                    }

                    // 单元格配置
                    const cellConfig = {
                        children: [new docx.Paragraph(paragraphConfig)],
                        margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100
                        }
                    };

                    // 添加背景色
                    if (backgroundColor && backgroundColor !== 'FFFFFF') {
                        // docx.js v7.8.2 只需要 fill 属性
                        cellConfig.shading = {
                            fill: backgroundColor
                        };
                        console.log('[元素处理] 单元格背景色:', backgroundColor, 'shading:', cellConfig.shading);
                    }

                    // 添加边框（如果有border样式）
                    // 优先使用解析出的值
                    const finalBorderWidth = borderWidthValue || styles.borderWidth || '1px';
                    const finalBorderColor = (borderColorMatch ? borderColorMatch[1].trim() : null) || styles.borderColor || '';
                    const borderWidth = WordExportUtils.parsePxValue(finalBorderWidth);
                    const borderColor = WordExportUtils.rgbToHex(finalBorderColor) || '000000';

                    if (borderWidth > 0) {
                        const borderStyle = {
                            style: docx.BorderStyle.SINGLE,
                            size: Math.max(1, Math.round(borderWidth * 8)),  // px to eighths of a point
                            color: borderColor
                        };

                        cellConfig.borders = {
                            top: borderStyle,
                            bottom: borderStyle,
                            left: borderStyle,
                            right: borderStyle
                        };
                    }

                    cells.push(new docx.TableCell(cellConfig));
                }

                if (cells.length > 0) {
                    rows.push(new docx.TableRow({ children: cells }));
                }
            }

            if (rows.length === 0) {
                console.log('[元素处理] 表格为空');
                return [];
            }

            console.log(`[元素处理] 表格完成: ${rows.length} 行`);

            // 表格整体样式
            const tableStyles = WordExportUtils.getComputedStyle(node);
            const tableBorderWidth = WordExportUtils.parsePxValue(tableStyles.borderWidth || '1px');
            const tableBorderColor = WordExportUtils.rgbToHex(tableStyles.borderColor) || '000000';

            const tableConfig = {
                rows: rows,
                width: {
                    size: 100,
                    type: docx.WidthType.PERCENTAGE
                }
            };

            // 添加表格边框
            if (tableBorderWidth > 0) {
                const borderStyle = {
                    style: docx.BorderStyle.SINGLE,
                    size: Math.max(1, Math.round(tableBorderWidth * 8)),
                    color: tableBorderColor
                };

                tableConfig.borders = {
                    top: borderStyle,
                    bottom: borderStyle,
                    left: borderStyle,
                    right: borderStyle,
                    insideHorizontal: borderStyle,
                    insideVertical: borderStyle
                };
            }

            return [new docx.Table(tableConfig)];
        },

        /**
         * 转换表格行（由 convertTable 处理）
         */
        async convertTableRow(node) {
            return [];
        },

        /**
         * 转换表格单元格（由 convertTable 处理）
         */
        async convertTableCell(node) {
            return [];
        },

        /**
         * 转换表头单元格（由 convertTable 处理）
         */
        async convertTableHeader(node) {
            return [];
        },

        /**
         * 转换图片
         * @param {HTMLElement} node - 图片元素
         * @returns {Array} Paragraph 数组（包含图片）
         */
        async convertImage(node) {
            try {
                const src = node.getAttribute('src');
                if (!src) {
                    console.log('[元素处理] 图片无 src 属性');
                    return [];
                }

                console.log('[元素处理] 转换图片:', src.substring(0, 50));

                const styles = WordExportUtils.getComputedStyle(node);

                // 获取图片数据
                let imageData;

                if (src.startsWith('data:')) {
                    // Base64 图片
                    console.log('[元素处理] 处理 Base64 图片');
                    imageData = WordExportUtils.base64ToArrayBuffer(src);
                } else if (src.startsWith('http://') || src.startsWith('https://')) {
                    // 网络图片（跨域可能失败）
                    console.log('[元素处理] 网络图片，尝试下载...');
                    try {
                        const response = await fetch(src, { mode: 'cors' });
                        imageData = await response.arrayBuffer();
                    } catch (error) {
                        console.error('[元素处理] 网络图片下载失败:', error);
                        return [new docx.Paragraph({
                            children: [new docx.TextRun({
                                text: `[图片加载失败: ${node.getAttribute('alt') || src}]`,
                                color: 'FF0000'
                            })]
                        })];
                    }
                } else {
                    // 相对路径（可能无法访问）
                    console.warn('[元素处理] 相对路径图片，可能无法访问:', src);
                    return [new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: `[图片: ${node.getAttribute('alt') || src}]`,
                            color: '999999'
                        })]
                    })];
                }

                // 获取尺寸
                let width = parseInt(node.getAttribute('width')) ||
                           WordExportUtils.parsePxValue(styles.width || '0');
                let height = parseInt(node.getAttribute('height')) ||
                            WordExportUtils.parsePxValue(styles.height || '0');

                // 如果没有指定尺寸，使用默认值
                if (!width && !height) {
                    width = 400;  // 默认宽度
                    height = 300; // 默认高度
                } else if (!width) {
                    width = height * 4 / 3;  // 保持 4:3 比例
                } else if (!height) {
                    height = width * 3 / 4;
                }

                console.log(`[元素处理] 图片尺寸: ${width}x${height}`);

                // 创建图片
                const imageRun = new docx.ImageRun({
                    data: imageData,
                    transformation: {
                        width: width,
                        height: height
                    }
                });

                // 获取对齐方式
                const alignment = this.getAlignment(styles.textAlign);

                const paragraphConfig = {
                    children: [imageRun],
                    spacing: {
                        before: 120,
                        after: 120
                    }
                };

                // 只在有效时添加对齐方式
                if (alignment) {
                    paragraphConfig.alignment = alignment;
                }

                return [new docx.Paragraph(paragraphConfig)];

            } catch (error) {
                console.error('[元素处理] 图片转换失败:', error);
                // 返回替代文本
                return [new docx.Paragraph({
                    children: [new docx.TextRun({
                        text: `[图片转换失败: ${node.getAttribute('alt') || '未知'}]`,
                        color: 'FF0000'
                    })]
                })];
            }
        },

        /**
         * 转换链接
         * @param {HTMLElement} node - 链接元素
         * @returns {Array} TextRun 数组（包含超链接）
         */
        async convertLink(node) {
            const href = node.getAttribute('href');
            const text = node.textContent;
            const styles = WordExportUtils.getComputedStyle(node);
            const textStyle = WordExportStyleMapper.convertTextRunStyles(styles);

            if (!href) {
                return [new docx.TextRun({ text: text, ...textStyle })];
            }

            // docx.js 的超链接需要在文档级别配置，这里简化处理
            return [new docx.TextRun({
                text: text,
                ...textStyle,
                color: '0000FF',
                underline: { type: docx.UnderlineType.SINGLE }
            })];
        },

        /**
         * 转换换行
         * @returns {Array} TextRun 数组（包含换行）
         */
        convertLineBreak() {
            return [new docx.TextRun({ break: 1 })];
        },

        /**
         * 转换水平线
         * @returns {Array} Paragraph 数组（包含边框）
         */
        convertHorizontalRule(node) {
            console.log('[元素处理] 转换水平线 <hr>');

            // 直接从 style 属性解析（getComputedStyle 在 iframe 中可能失效）
            const inlineStyle = node.getAttribute('style') || '';
            let borderColorValue = null;
            let borderWidthValue = null;

            // 尝试匹配 border 简写：border: 2px solid #667eea
            const borderMatch = inlineStyle.match(/border:\s*([^;]+)/i);
            if (borderMatch) {
                const parts = borderMatch[1].trim().split(/\s+/);
                borderWidthValue = parts[0];
                if (parts.length > 2) {
                    borderColorValue = parts[2];
                }
            } else {
                // 尝试匹配单独的属性
                const colorMatch = inlineStyle.match(/(?:border-color|color):\s*([^;]+)/i);
                const widthMatch = inlineStyle.match(/border-width:\s*([^;]+)/i);
                borderColorValue = colorMatch ? colorMatch[1] : null;
                borderWidthValue = widthMatch ? widthMatch[1] : null;
            }

            console.log('[元素处理] hr 样式解析:', {
                inline: inlineStyle,
                borderValue: borderMatch ? borderMatch[1] : null,
                width: borderWidthValue,
                color: borderColorValue
            });

            // 备用：使用 computed style
            const styles = WordExportUtils.getComputedStyle(node);
            const borderColor = WordExportUtils.rgbToHex(borderColorValue) ||
                                WordExportUtils.rgbToHex(styles.borderColor) ||
                                WordExportUtils.rgbToHex(styles.color) || 'CCCCCC';
            const borderWidth = WordExportUtils.parsePxValue(borderWidthValue || styles.borderWidth || styles.height || '1px');
            const borderSize = Math.max(6, Math.round(borderWidth * 8));  // 至少 6 eighths

            console.log('[元素处理] hr 最终结果:', {
                color: borderColor,
                width: borderWidth + 'px',
                size: borderSize
            });

            return [new docx.Paragraph({
                children: [new docx.TextRun({ text: '' })],
                border: {
                    bottom: {
                        style: docx.BorderStyle.SINGLE,
                        size: borderSize,
                        color: borderColor
                    }
                },
                spacing: { before: 200, after: 200 }
            })];
        },

        /**
         * 转换预格式化文本
         * @param {HTMLElement} node - pre 元素
         * @returns {Array} Paragraph 数组
         */
        async convertPreformatted(node) {
            const text = node.textContent;
            const lines = text.split('\n');
            const results = [];

            lines.forEach(line => {
                results.push(new docx.Paragraph({
                    children: [new docx.TextRun({
                        text: line || ' ',
                        font: 'Courier New',
                        size: 20
                    })],
                    spacing: { line: 240 }
                }));
            });

            return results;
        },

        /**
         * 转换代码
         * @param {HTMLElement} node - code 元素
         * @returns {Array} TextRun 数组
         */
        async convertCode(node) {
            const text = node.textContent;
            return [new docx.TextRun({
                text: text,
                font: 'Courier New',
                size: 20,
                shading: {
                    type: docx.ShadingType.CLEAR,
                    fill: 'F5F5F5'
                }
            })];
        },

        /**
         * 转换引用块
         * @param {HTMLElement} node - blockquote 元素
         * @returns {Array} Paragraph 数组
         */
        async convertBlockquote(node) {
            const children = await this.convertInlineContent(node);
            const styles = WordExportUtils.getComputedStyle(node);
            const paragraphStyles = WordExportStyleMapper.convertParagraphStyles(styles);

            return [new docx.Paragraph({
                children: children,
                ...paragraphStyles,
                indent: { left: 720 }, // 增加左缩进
                border: {
                    left: {
                        style: "single",  // 使用字符串
                        size: 12,
                        color: 'CCCCCC'
                    }
                }
            })];
        },

        /**
         * 获取对齐方式
         * @param {string} textAlign - CSS 对齐方式
         * @returns {string|undefined} docx 对齐常量
         */
        getAlignment(textAlign) {
            if (!textAlign) return undefined;

            // 检查 docx.AlignmentType 是否存在
            if (typeof docx === 'undefined' || !docx.AlignmentType) {
                console.warn('[元素处理] docx.AlignmentType 不可用');
                return undefined;
            }

            const alignmentMap = {
                'left': docx.AlignmentType.LEFT,
                'center': docx.AlignmentType.CENTER,
                'right': docx.AlignmentType.RIGHT,
                'justify': docx.AlignmentType.JUSTIFIED
            };
            return alignmentMap[textAlign];
        },

        /**
         * 转换内联内容
         * @param {HTMLElement} node - 父元素
         * @returns {Array} TextRun 数组
         */
        async convertInlineContent(node, parentStyles = {}) {
            const runs = [];

            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent;
                    if (text) {
                        runs.push(new docx.TextRun({
                            text: text,
                            ...parentStyles
                        }));
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.tagName.toLowerCase();
                    const styles = WordExportUtils.getComputedStyle(child);

                    // 构建当前元素的样式
                    const currentStyles = { ...parentStyles };

                    // 粗体
                    if (['strong', 'b'].includes(tag)) {
                        currentStyles.bold = true;
                    }

                    // 斜体
                    if (['em', 'i'].includes(tag)) {
                        currentStyles.italics = true;
                    }

                    // 下划线
                    if (tag === 'u') {
                        currentStyles.underline = {};
                    }

                    // 代码
                    if (tag === 'code') {
                        currentStyles.font = 'Courier New';
                    }

                    // 颜色
                    const color = WordExportUtils.rgbToHex(styles.color || '');
                    if (color) {
                        currentStyles.color = color;
                    }

                    // 字号
                    const fontSize = WordExportUtils.parsePxValue(styles.fontSize || '0');
                    if (fontSize > 0) {
                        currentStyles.size = Math.round(fontSize * 1.5);
                    }

                    // 内联格式标签
                    if (['span', 'strong', 'b', 'em', 'i', 'u', 'code', 'a'].includes(tag)) {
                        // 递归处理子节点
                        const childRuns = await this.convertInlineContent(child, currentStyles);
                        runs.push(...childRuns);
                    } else if (tag === 'br') {
                        runs.push(new docx.TextRun({ break: 1 }));
                    } else {
                        // 其他标签：递归处理但不累加样式
                        const childRuns = await this.convertInlineContent(child, parentStyles);
                        runs.push(...childRuns);
                    }
                }
            }

            return runs;
        },

        /**
         * 转换子元素
         * @param {HTMLElement} node - 父元素
         * @param {Object} context - 上下文
         * @returns {Array} docx 元素数组
         */
        async convertChildren(node, context = {}) {
            const results = [];

            for (const child of node.childNodes) {
                const converted = await this.convertNode(child, context);
                if (converted && Array.isArray(converted)) {
                    results.push(...converted);
                }
            }

            return results;
        }
    };

    // 暴露到全局
    window.WordExportElementHandlers = ElementHandlers;
})();

