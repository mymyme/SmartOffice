/**
 * Word 导出工具函数模块
 * 提供单位转换、颜色处理、DOM 操作等通用工具函数
 */

(function() {
    'use strict';

    const WordExportUtils = {
        /**
         * 像素转 twips（1 twip = 1/1440 inch）
         * @param {string|number} px - 像素值
         * @returns {number} twips 值
         */
        twipsFromPx(px) {
            const value = this.parsePxValue(px);
            return Math.round(value * 15); // 1px ≈ 15 twips (96 DPI)
        },

        /**
         * 像素转半点（1 pt = 2 half-points）
         * @param {string|number} px - 像素值
         * @returns {number} 半点值
         */
        halfPointsFromPx(px) {
            const value = this.parsePxValue(px);
            return Math.round(value * 1.5); // 1px ≈ 0.75pt at 96 DPI
        },

        /**
         * 解析像素值
         * @param {string|number} value - CSS 像素值
         * @returns {number} 数值
         */
        parsePxValue(value) {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const num = parseFloat(value.replace(/px|pt|em|rem/gi, ''));
                return isNaN(num) ? 0 : num;
            }
            return 0;
        },

        /**
         * RGB 颜色转 Hex
         * @param {string} rgb - RGB 颜色值
         * @returns {string|null} Hex 颜色（不含 #），如果是透明或无效返回 null
         */
        rgbToHex(rgb) {
            if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
                return null;
            }

            if (rgb.startsWith('#')) {
                const hex = rgb.substring(1).toUpperCase();
                // 处理缩写格式 #RGB -> #RRGGBB
                if (hex.length === 3) {
                    return hex.split('').map(c => c + c).join('');
                }
                return hex.padStart(6, '0');
            }

            // 处理 rgb() 或 rgba() 格式
            const match = rgb.match(/\d+/g);
            if (!match || match.length < 3) {
                console.warn('[工具] 无法解析颜色:', rgb);
                return null;
            }

            // 检查 alpha 通道
            if (match.length >= 4 && parseFloat(match[3]) === 0) {
                return null;
            }

            const [r, g, b] = match.map(Number);
            const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
            console.log(`[工具] 颜色转换: ${rgb} -> ${hex}`);
            return hex;
        },

        /**
         * 从渐变中提取主色
         * @param {string} backgroundImage - CSS background-image 值
         * @returns {string|null} Hex 颜色
         */
        extractGradientColor(backgroundImage) {
            if (!backgroundImage || !backgroundImage.includes('gradient')) {
                return null;
            }

            const colorMatch = backgroundImage.match(/#[0-9a-f]{6}|rgb\([^)]+\)/i);
            if (colorMatch) {
                return this.rgbToHex(colorMatch[0]);
            }

            return null;
        },

        /**
         * Base64 转 ArrayBuffer
         * @param {string} base64 - Base64 字符串
         * @returns {ArrayBuffer} 二进制数据
         */
        base64ToArrayBuffer(base64) {
            try {
                const data = base64.split(',')[1] || base64;
                const binary = atob(data);
                const buffer = new ArrayBuffer(binary.length);
                const view = new Uint8Array(buffer);

                for (let i = 0; i < binary.length; i++) {
                    view[i] = binary.charCodeAt(i);
                }

                return buffer;
            } catch (error) {
                console.error('Base64 转换失败:', error);
                return new ArrayBuffer(0);
            }
        },

        /**
         * Blob 转 Base64
         * @param {Blob} blob - Blob 对象
         * @returns {Promise<string>} Base64 字符串
         */
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },

        /**
         * 获取元素的计算样式
         * @param {HTMLElement} element - DOM 元素
         * @returns {CSSStyleDeclaration|Object} 计算样式
         */
        getComputedStyle(element) {
            if (!element || element.nodeType !== Node.ELEMENT_NODE) {
                return {};
            }

            if (typeof window !== 'undefined' && window.getComputedStyle) {
                return window.getComputedStyle(element);
            }

            return this.parseInlineStyles(element.getAttribute('style') || '');
        },

        /**
         * 解析内联样式字符串
         * @param {string} styleStr - 样式字符串
         * @returns {Object} 样式对象
         */
        parseInlineStyles(styleStr) {
            const styles = {};
            if (!styleStr) return styles;

            styleStr.split(';').forEach(rule => {
                const [prop, value] = rule.split(':').map(s => s.trim());
                if (prop && value) {
                    styles[this.camelCase(prop)] = value;
                }
            });

            return styles;
        },

        /**
         * 转为驼峰命名
         * @param {string} str - 连字符字符串
         * @returns {string} 驼峰命名字符串
         */
        camelCase(str) {
            return str.replace(/-([a-z])/g, (m, p1) => p1.toUpperCase());
        },

        /**
         * 解析 HTML 字符串为 DOM
         * @param {string} html - HTML 字符串
         * @returns {Document} DOM 文档
         */
        parseHTML(html) {
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        },

        /**
         * 检测是否为浮动元素
         * @param {CSSStyleDeclaration} styles - 元素样式
         * @returns {boolean} 是否浮动
         */
        isFloating(styles) {
            return styles.position === 'absolute' ||
                   styles.position === 'fixed' ||
                   styles.float !== 'none';
        },

        /**
         * 深度克隆对象
         * @param {any} obj - 源对象
         * @returns {any} 克隆对象
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj);
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));

            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        },

        /**
         * 清理 HTML（移除脚本、事件处理器等）
         * @param {string} html - HTML 字符串
         * @returns {string} 清理后的 HTML
         */
        sanitizeHTML(html) {
            // 移除 <script> 标签
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

            // 移除事件处理器属性
            html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

            // 移除 javascript: 协议
            html = html.replace(/javascript:/gi, '');

            return html;
        },

        /**
         * 获取图片的真实尺寸
         * @param {string} src - 图片 URL
         * @returns {Promise<{width: number, height: number}>} 图片尺寸
         */
        getImageDimensions(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });
                };
                img.onerror = () => {
                    reject(new Error('图片加载失败'));
                };
                img.src = src;
            });
        },

        /**
         * 防抖函数
         * @param {Function} func - 目标函数
         * @param {number} wait - 等待时间（毫秒）
         * @returns {Function} 防抖后的函数
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * 格式化文件大小
         * @param {number} bytes - 字节数
         * @returns {string} 格式化后的大小
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        /**
         * 生成唯一 ID
         * @returns {string} 唯一标识符
         */
        generateId() {
            return 'word_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        /**
         * 等待指定时间
         * @param {number} ms - 毫秒数
         * @returns {Promise<void>}
         */
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // 暴露到全局
    window.WordExportUtils = WordExportUtils;
})();

