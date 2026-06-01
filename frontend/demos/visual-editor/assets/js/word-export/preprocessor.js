/**
 * Word 导出预处理模块
 * 在转换前对 HTML 进行预处理和优化
 */

(function() {
    'use strict';

    const Preprocessor = {
        /**
         * 预处理 HTML 内容
         * @param {string} html - 原始 HTML
         * @param {Object} options - 选项
         * @returns {Promise<{html: string, dom: Document, images: Array}>}
         */
        async preprocess(html, options = {}) {
            console.log('[预处理] 开始预处理 HTML...');

            // 1. 清理 HTML
            html = this.cleanHTML(html);

            // 2. 解析为 DOM
            const dom = WordExportUtils.parseHTML(html);

            // 3. 内联所有样式
            this.inlineStyles(dom);

            // 4. 处理 ECharts 图表（转换为图片）
            if (options.processCharts !== false && typeof window.WordExportEChartsProcessor !== 'undefined') {
                await window.WordExportEChartsProcessor.processAllCharts(dom, options.chartOptions);
            }

            // 5. 提取图片列表
            const images = this.extractImages(dom);

            // 6. 优化布局
            WordExportLayoutOptimizer.optimizeLayout(dom);

            // 7. 处理图片（如果需要）
            if (options.processImages !== false) {
                await this.processAllImages(dom, images, options.imageOptions);
            }

            // 8. 移除不需要的元素
            this.removeUnnecessaryElements(dom);

            // 9. 标准化文本
            this.normalizeText(dom);

            console.log('[预处理] 预处理完成');

            return {
                html: dom.body.innerHTML,
                dom: dom,
                images: images
            };
        },

        /**
         * 清理 HTML（移除脚本、事件等）
         * @param {string} html - 原始 HTML
         * @returns {string} 清理后的 HTML
         */
        cleanHTML(html) {
            // 移除 <script> 标签
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

            // 移除 <style> 标签（样式会被内联）
            html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

            // 移除注释
            html = html.replace(/<!--[\s\S]*?-->/g, '');

            // 移除事件处理器
            html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

            // 移除 javascript: 协议
            html = html.replace(/javascript:/gi, '');

            return html;
        },

        /**
         * 内联所有样式
         * @param {Document} dom - DOM 文档
         */
        inlineStyles(dom) {
            // 收集所有 <style> 标签中的规则
            const styleRules = this.collectStyleRules(dom);

            // 应用到每个元素
            dom.querySelectorAll('*').forEach(element => {
                try {
                    const computedStyle = this.computeStyleForElement(element, styleRules);
                    const inlineStyle = this.serializeStyle(computedStyle);

                    if (inlineStyle) {
                        const existingStyle = element.getAttribute('style') || '';
                        element.setAttribute('style', inlineStyle + '; ' + existingStyle);
                    }
                } catch (error) {
                    // 忽略错误，继续处理
                }
            });

            // 移除所有 <style> 和 <link> 标签
            dom.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
                el.parentNode.removeChild(el);
            });

            console.log('[预处理] 样式已内联');
        },

        /**
         * 收集样式规则
         * @param {Document} dom - DOM 文档
         * @returns {Array} 样式规则数组
         */
        collectStyleRules(dom) {
            const rules = [];

            dom.querySelectorAll('style').forEach(styleEl => {
                try {
                    const cssText = styleEl.textContent;
                    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
                    let match;

                    while ((match = ruleRegex.exec(cssText)) !== null) {
                        const selector = match[1].trim();
                        const declarations = match[2].trim();

                        rules.push({
                            selector: selector,
                            declarations: this.parseDeclarations(declarations)
                        });
                    }
                } catch (error) {
                    console.warn('[预处理] 样式规则解析失败:', error);
                }
            });

            return rules;
        },

        /**
         * 解析 CSS 声明
         * @param {string} declarationsStr - CSS 声明字符串
         * @returns {Object} 声明对象
         */
        parseDeclarations(declarationsStr) {
            const declarations = {};

            declarationsStr.split(';').forEach(decl => {
                const [prop, value] = decl.split(':').map(s => s.trim());
                if (prop && value) {
                    declarations[prop] = value;
                }
            });

            return declarations;
        },

        /**
         * 计算元素的样式
         * @param {HTMLElement} element - 元素
         * @param {Array} styleRules - 样式规则
         * @returns {Object} 计算后的样式
         */
        computeStyleForElement(element, styleRules) {
            const computed = {};

            // 应用匹配的规则
            styleRules.forEach(rule => {
                try {
                    if (element.matches(rule.selector)) {
                        Object.assign(computed, rule.declarations);
                    }
                } catch (error) {
                    // 选择器可能无效，忽略
                }
            });

            return computed;
        },

        /**
         * 序列化样式对象为字符串
         * @param {Object} style - 样式对象
         * @returns {string} 样式字符串
         */
        serializeStyle(style) {
            return Object.entries(style)
                .map(([prop, value]) => `${prop}: ${value}`)
                .join('; ');
        },

        /**
         * 提取所有图片
         * @param {Document} dom - DOM 文档
         * @returns {Array} 图片信息数组
         */
        extractImages(dom) {
            const images = [];
            const imgElements = dom.querySelectorAll('img');

            imgElements.forEach((img, index) => {
                const src = img.getAttribute('src');
                if (src) {
                    images.push({
                        index: index,
                        element: img,
                        src: src,
                        alt: img.getAttribute('alt') || '',
                        width: img.getAttribute('width') || img.style.width,
                        height: img.getAttribute('height') || img.style.height,
                        isBase64: src.startsWith('data:')
                    });
                }
            });

            console.log(`[预处理] 找到 ${images.length} 张图片`);
            return images;
        },

        /**
         * 处理所有图片
         * @param {Document} dom - DOM 文档
         * @param {Array} images - 图片信息数组
         * @param {Object} options - 图片处理选项
         */
        async processAllImages(dom, images, options = {}) {
            if (images.length === 0) return;

            console.log(`[预处理] 开始处理 ${images.length} 张图片...`);

            for (let i = 0; i < images.length; i++) {
                const img = images[i];

                try {
                    // 如果已经是 Base64，跳过
                    if (img.isBase64) {
                        console.log(`[预处理] 图片 ${i + 1}/${images.length}: 已是 Base64，跳过`);
                        continue;
                    }

                    // 只处理本地图片
                    if (!WordExportImageProcessor.isLocalImage(img.src)) {
                        console.log(`[预处理] 图片 ${i + 1}/${images.length}: 外部图片，保留链接`);
                        continue;
                    }

                    console.log(`[预处理] 图片 ${i + 1}/${images.length}: 处理中...`);

                    // 下载并转换
                    const result = await WordExportImageProcessor.processImage(img.src, options);

                    // 转为 Base64
                    const base64 = await this.arrayBufferToBase64(result.data, result.format);

                    // 更新 img 元素
                    img.element.setAttribute('src', base64);

                    console.log(`[预处理] 图片 ${i + 1}/${images.length}: 完成`);

                } catch (error) {
                    console.error(`[预处理] 图片 ${i + 1}/${images.length}: 处理失败`, error);
                }

                // 避免阻塞 UI
                if (i < images.length - 1) {
                    await WordExportUtils.sleep(0);
                }
            }

            console.log('[预处理] 图片处理完成');
        },

        /**
         * ArrayBuffer 转 Base64
         * @param {ArrayBuffer} buffer - 二进制数据
         * @param {string} format - 图片格式
         * @returns {Promise<string>} Base64 字符串
         */
        async arrayBufferToBase64(buffer, format) {
            const blob = new Blob([buffer], { type: `image/${format}` });
            return await WordExportUtils.blobToBase64(blob);
        },

        /**
         * 移除不需要的元素
         * @param {Document} dom - DOM 文档
         */
        removeUnnecessaryElements(dom) {
            // 移除隐藏元素
            const hiddenElements = Array.from(dom.querySelectorAll('*')).filter(el => {
                const styles = WordExportUtils.getComputedStyle(el);
                return styles.display === 'none' ||
                       styles.visibility === 'hidden' ||
                       parseFloat(styles.opacity) === 0;
            });

            hiddenElements.forEach(el => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });

            // 移除特定标签
            const tagsToRemove = ['script', 'noscript', 'iframe', 'object', 'embed'];
            tagsToRemove.forEach(tag => {
                dom.querySelectorAll(tag).forEach(el => {
                    if (el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            });

            console.log(`[预处理] 移除 ${hiddenElements.length} 个不必要的元素`);
        },

        /**
         * 标准化文本
         * @param {Document} dom - DOM 文档
         */
        normalizeText(dom) {
            // 遍历所有文本节点
            const walker = dom.createTreeWalker(
                dom.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            let normalized = 0;

            while (node = walker.nextNode()) {
                try {
                    const original = node.textContent;

                    // 规范化空白字符
                    let normalized_text = original
                        .replace(/[\r\n\t]/g, ' ')  // 替换换行和制表符为空格
                        .replace(/\s+/g, ' ');      // 合并多个空格

                    // 如果不是在 pre 标签内，去除首尾空格
                    const parent = node.parentElement;
                    if (parent && parent.tagName.toLowerCase() !== 'pre') {
                        normalized_text = normalized_text.trim();
                    }

                    if (original !== normalized_text) {
                        node.textContent = normalized_text;
                        normalized++;
                    }
                } catch (error) {
                    // 忽略错误
                }
            }

            if (normalized > 0) {
                console.log(`[预处理] 标准化 ${normalized} 个文本节点`);
            }
        },

        /**
         * 检测文档复杂度
         * @param {string} html - HTML 内容
         * @returns {Object} 复杂度信息
         */
        detectComplexity(html) {
            const complexity = {
                score: 0,
                reasons: [],
                level: 'simple'
            };

            const checks = [
                {
                    pattern: /display:\s*flex/gi,
                    weight: 10,
                    reason: '使用了 Flexbox 布局'
                },
                {
                    pattern: /display:\s*grid/gi,
                    weight: 10,
                    reason: '使用了 Grid 布局'
                },
                {
                    pattern: /linear-gradient|radial-gradient/gi,
                    weight: 8,
                    reason: '使用了渐变背景'
                },
                {
                    pattern: /transform:\s*[^;]+/gi,
                    weight: 8,
                    reason: '使用了变换效果'
                },
                {
                    pattern: /position:\s*absolute|position:\s*fixed/gi,
                    weight: 7,
                    reason: '使用了绝对定位'
                },
                {
                    pattern: /@keyframes|animation:/gi,
                    weight: 5,
                    reason: '使用了动画'
                },
                {
                    pattern: /box-shadow:\s*[^;]+/gi,
                    weight: 3,
                    reason: '使用了阴影效果'
                }
            ];

            checks.forEach(check => {
                const matches = html.match(check.pattern);
                if (matches) {
                    const count = matches.length;
                    complexity.score += check.weight * count;
                    complexity.reasons.push(`${check.reason} (${count}次)`);
                }
            });

            // 确定复杂度等级
            if (complexity.score < 20) {
                complexity.level = 'simple';
            } else if (complexity.score < 50) {
                complexity.level = 'medium';
            } else {
                complexity.level = 'complex';
            }

            console.log('[预处理] 文档复杂度:', complexity);
            return complexity;
        }
    };

    // 暴露到全局
    window.WordExportPreprocessor = Preprocessor;
})();

