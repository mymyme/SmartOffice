/**
 * Word 导出核心转换器
 * 协调整个HTML到Word文档的转换流程
 */

(function() {
    'use strict';

    class HTMLToWordConverter {
        constructor(htmlContent, options = {}) {
            this.htmlContent = htmlContent;
            this.options = {
                processImages: true,
                imageQuality: 0.9,
                imageMaxWidth: 1920,
                imageMaxHeight: 1080,
                detectComplexity: true,
                ...options
            };

            this.dom = null;
            this.document = null;
            this.images = [];
            this.complexity = null;
        }

        /**
         * 执行转换
         * @param {Function} onProgress - 进度回调 (progress, message)
         * @returns {Promise<docx.Document>} Word 文档对象
         */
        async convert(onProgress = null) {
            try {
                console.log('[转换器] 开始转换流程...');

                // 检查 docx 库是否已加载（优先使用安全副本）
                if (typeof docx === 'undefined' && typeof window._docxSafe !== 'undefined') {
                    window.docx = window._docxSafe;
                    console.log('[转换器] docx 已从安全副本恢复');
                }

                if (typeof docx === 'undefined') {
                    throw new Error('docx.js 库未加载，请确保已正确引入');
                }

                // Phase 1: 检测复杂度
                if (this.options.detectComplexity) {
                    this.updateProgress(onProgress, 5, '分析文档复杂度...');
                    this.complexity = WordExportPreprocessor.detectComplexity(this.htmlContent);
                    console.log('[转换器] 文档复杂度:', this.complexity);
                }

                // Phase 2: 预处理
                this.updateProgress(onProgress, 10, '预处理 HTML 内容...');
                const preprocessed = await WordExportPreprocessor.preprocess(
                    this.htmlContent,
                    {
                        processImages: this.options.processImages,
                        imageOptions: {
                            quality: this.options.imageQuality,
                            maxWidth: this.options.imageMaxWidth,
                            maxHeight: this.options.imageMaxHeight
                        }
                    }
                );

                this.dom = preprocessed.dom;
                this.images = preprocessed.images;

                console.log('[转换器] 预处理完成');

                // Phase 3: 转换 DOM 内容（先转换元素）
                this.updateProgress(onProgress, 40, '转换文档内容...');
                const elements = await this.convertDOMContent();
                console.log(`[转换器] 已转换 ${elements.length} 个元素`);

                // Phase 4: 创建 Word 文档结构（使用转换好的元素）
                this.updateProgress(onProgress, 80, '创建文档结构...');
                this.document = this.createDocument(elements);
                console.log('[转换器] 文档已创建并包含所有元素');

                // Phase 6: 完成
                this.updateProgress(onProgress, 100, '转换完成！');
                console.log('[转换器] 转换流程完成');

                return this.document;

            } catch (error) {
                console.error('[转换器] 转换失败:', error);
                throw error;
            }
        }

        /**
         * 创建 Word 文档
         * @param {Array} elements - docx 元素数组
         * @returns {docx.Document} 文档对象
         */
        createDocument(elements = []) {
            // 如果没有元素，至少添加一个空段落
            if (elements.length === 0) {
                elements = [new docx.Paragraph({
                    children: [new docx.TextRun({ text: '' })]
                })];
            }

            return new docx.Document({
                creator: "SmartOffice Visual Editor",
                title: "导出文档",
                description: "由可视化编辑器自动生成",

                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: 720,    // 0.5 inch
                                right: 720,
                                bottom: 720,
                                left: 720
                            },
                            size: {
                                width: 11906,  // A4 宽度（twips）
                                height: 16838  // A4 高度（twips）
                            }
                        }
                    },
                    children: elements // 直接使用传入的元素
                }],

                // 默认样式
                styles: {
                    default: {
                        document: {
                            run: {
                                font: "Segoe UI",
                                size: 24, // 12pt = 24 half-points
                                color: "000000"
                            },
                            paragraph: {
                                spacing: {
                                    line: 276,
                                    before: 0,
                                    after: 0
                                }
                            }
                        }
                    },
                    paragraphStyles: [
                        {
                            id: "Normal",
                            name: "Normal",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                font: "Segoe UI",
                                size: 24
                            },
                            paragraph: {
                                spacing: { line: 276, before: 0, after: 120 }
                            }
                        },
                        {
                            id: "Heading1",
                            name: "Heading 1",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                font: "Segoe UI",
                                size: 32,
                                bold: true,
                                color: "2E74B5"
                            },
                            paragraph: {
                                spacing: { before: 240, after: 120 }
                            }
                        },
                        {
                            id: "Heading2",
                            name: "Heading 2",
                            basedOn: "Normal",
                            next: "Normal",
                            run: {
                                font: "Segoe UI",
                                size: 28,
                                bold: true,
                                color: "2E74B5"
                            },
                            paragraph: {
                                spacing: { before: 200, after: 100 }
                            }
                        }
                    ]
                },

                // 编号样式（用于列表）
                numbering: {
                    config: [
                        {
                            reference: "default-numbering",
                            levels: [
                                {
                                    level: 0,
                                    format: docx.LevelFormat.DECIMAL,
                                    text: "%1.",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 720, hanging: 360 }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            });
        }

        /**
         * 转换 DOM 内容
         * @returns {Promise<Array>} docx 元素数组
         */
        async convertDOMContent() {
            const elements = [];

            if (!this.dom || !this.dom.body) {
                throw new Error('DOM 内容无效');
            }

            console.log('[转换器] 开始遍历 body 子节点，总数:', this.dom.body.childNodes.length);

            // 遍历 body 的直接子元素
            let nodeIndex = 0;
            for (const child of this.dom.body.childNodes) {
                try {
                    console.log(`[转换器] 处理节点 ${++nodeIndex}:`, {
                        type: child.nodeType,
                        tag: child.tagName || 'text',
                        text: child.textContent?.substring(0, 30)
                    });

                    const converted = await WordExportElementHandlers.convertNode(child);

                    if (converted && Array.isArray(converted) && converted.length > 0) {
                        console.log(`[转换器] 节点 ${nodeIndex} 转换成功，生成 ${converted.length} 个元素`);
                        elements.push(...converted);
                    } else {
                        console.log(`[转换器] 节点 ${nodeIndex} 转换结果为空`);
                    }
                } catch (error) {
                    console.error(`[转换器] 节点 ${nodeIndex} 转换失败:`, error);
                    // 添加错误占位符
                    elements.push(new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: `[转换失败: ${child.tagName || 'unknown'}]`,
                            color: 'FF0000'
                        })]
                    }));
                }
            }

            console.log(`[转换器] 转换完成，共生成 ${elements.length} 个元素`);

            // 如果没有内容，添加空段落
            if (elements.length === 0) {
                console.warn('[转换器] 没有转换出任何元素，添加空段落');
                elements.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: '(文档为空)' })]
                }));
            }

            return elements;
        }


        /**
         * 更新进度
         * @param {Function} callback - 进度回调
         * @param {number} progress - 进度（0-100）
         * @param {string} message - 消息
         */
        updateProgress(callback, progress, message) {
            if (typeof callback === 'function') {
                callback(progress, message);
            }
        }

        /**
         * 获取文档统计信息
         * @returns {Object} 统计信息
         */
        getStats() {
            return {
                complexity: this.complexity,
                images: this.images.length,
                imagesProcessed: this.images.filter(img => img.isBase64).length,
                hasDocument: !!this.document
            };
        }
    }

    // 暴露到全局
    window.HTMLToWordConverter = HTMLToWordConverter;

    /**
     * 便捷导出函数
     * @param {string} htmlContent - HTML 内容
     * @param {Object} options - 选项
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Blob>} Word 文档 Blob
     */
    window.exportHTMLToWord = async function(htmlContent, options = {}, onProgress = null) {
        try {
            // 创建转换器
            const converter = new HTMLToWordConverter(htmlContent, options);

            // 执行转换
            const document = await converter.convert(onProgress);

            // 生成 Blob
            if (onProgress) onProgress(95, '生成 Word 文件...');

            const blob = await docx.Packer.toBlob(document);

            if (onProgress) onProgress(100, '完成！');

            // 输出统计信息
            const stats = converter.getStats();
            console.log('[导出] 统计信息:', stats);

            return blob;

        } catch (error) {
            console.error('[导出] 导出失败:', error);
            throw error;
        }
    };

})();

