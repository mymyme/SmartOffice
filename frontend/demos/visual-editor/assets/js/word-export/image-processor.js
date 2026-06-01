/**
 * Word 导出图片处理模块
 * 处理图片下载、压缩、格式转换
 */

(function() {
    'use strict';

    const ImageProcessor = {
        /**
         * 处理图片（下载并转换为 Base64）
         * @param {string} src - 图片 URL
         * @param {Object} options - 选项
         * @returns {Promise<{data: ArrayBuffer, width: number, height: number, format: string}>}
         */
        async processImage(src, options = {}) {
            const {
                maxWidth = 1920,
                maxHeight = 1080,
                quality = 0.9,
                format = 'jpeg'
            } = options;

            try {
                // 如果是 Base64，直接转换
                if (src.startsWith('data:')) {
                    return await this.processBase64Image(src, { maxWidth, maxHeight, quality, format });
                }

                // 下载远程图片
                const blob = await this.fetchImage(src);

                // 压缩和转换
                const compressedBlob = await this.compressImage(blob, {
                    maxWidth,
                    maxHeight,
                    quality,
                    format
                });

                // 转为 ArrayBuffer
                const arrayBuffer = await this.blobToArrayBuffer(compressedBlob);

                // 获取尺寸
                const dimensions = await this.getImageDimensions(URL.createObjectURL(compressedBlob));

                return {
                    data: arrayBuffer,
                    width: dimensions.width,
                    height: dimensions.height,
                    format: format
                };

            } catch (error) {
                console.error('图片处理失败:', src, error);
                throw error;
            }
        },

        /**
         * 处理 Base64 图片
         * @param {string} base64 - Base64 字符串
         * @param {Object} options - 选项
         * @returns {Promise<Object>}
         */
        async processBase64Image(base64, options) {
            const blob = await this.base64ToBlob(base64);

            const compressedBlob = await this.compressImage(blob, options);
            const arrayBuffer = await this.blobToArrayBuffer(compressedBlob);
            const dimensions = await this.getImageDimensions(URL.createObjectURL(compressedBlob));

            return {
                data: arrayBuffer,
                width: dimensions.width,
                height: dimensions.height,
                format: options.format
            };
        },

        /**
         * 下载图片
         * @param {string} url - 图片 URL
         * @returns {Promise<Blob>}
         */
        async fetchImage(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.blob();
            } catch (error) {
                console.error('图片下载失败:', url, error);
                throw new Error(`无法下载图片: ${url}`);
            }
        },

        /**
         * 压缩图片
         * @param {Blob} blob - 图片 Blob
         * @param {Object} options - 压缩选项
         * @returns {Promise<Blob>}
         */
        compressImage(blob, options) {
            return new Promise((resolve, reject) => {
                const {
                    maxWidth = 1920,
                    maxHeight = 1080,
                    quality = 0.9,
                    format = 'jpeg'
                } = options;

                const img = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                img.onload = () => {
                    try {
                        let { width, height } = img;

                        // 计算缩放比例
                        if (width > maxWidth || height > maxHeight) {
                            const widthRatio = maxWidth / width;
                            const heightRatio = maxHeight / height;
                            const ratio = Math.min(widthRatio, heightRatio);

                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }

                        // 设置画布尺寸
                        canvas.width = width;
                        canvas.height = height;

                        // 绘制图片
                        ctx.drawImage(img, 0, 0, width, height);

                        // 转换为 Blob
                        canvas.toBlob(
                            (resultBlob) => {
                                if (resultBlob) {
                                    resolve(resultBlob);
                                } else {
                                    reject(new Error('图片压缩失败'));
                                }
                            },
                            `image/${format}`,
                            quality
                        );
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('图片加载失败'));
                };

                img.src = URL.createObjectURL(blob);
            });
        },

        /**
         * Base64 转 Blob
         * @param {string} base64 - Base64 字符串
         * @returns {Promise<Blob>}
         */
        async base64ToBlob(base64) {
            try {
                const response = await fetch(base64);
                return await response.blob();
            } catch (error) {
                console.error('Base64 转 Blob 失败:', error);
                throw error;
            }
        },

        /**
         * Blob 转 ArrayBuffer
         * @param {Blob} blob - Blob 对象
         * @returns {Promise<ArrayBuffer>}
         */
        blobToArrayBuffer(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(blob);
            });
        },

        /**
         * 获取图片尺寸
         * @param {string} src - 图片 URL
         * @returns {Promise<{width: number, height: number}>}
         */
        getImageDimensions(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });
                    URL.revokeObjectURL(src);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(src);
                    reject(new Error('无法获取图片尺寸'));
                };
                img.src = src;
            });
        },

        /**
         * 批量处理图片
         * @param {Array<string>} imageUrls - 图片 URL 数组
         * @param {Object} options - 选项
         * @param {Function} onProgress - 进度回调
         * @returns {Promise<Array<Object>>}
         */
        async processImages(imageUrls, options = {}, onProgress = null) {
            const results = [];
            const total = imageUrls.length;

            for (let i = 0; i < total; i++) {
                const url = imageUrls[i];

                if (onProgress) {
                    onProgress(i + 1, total, url);
                }

                try {
                    const result = await this.processImage(url, options);
                    results.push({
                        url: url,
                        success: true,
                        data: result
                    });
                } catch (error) {
                    console.error(`图片处理失败 [${i + 1}/${total}]:`, url, error);
                    results.push({
                        url: url,
                        success: false,
                        error: error.message
                    });
                }

                // 避免阻塞 UI
                if (i < total - 1) {
                    await WordExportUtils.sleep(0);
                }
            }

            return results;
        },

        /**
         * 从 HTML 中提取所有图片 URL
         * @param {string} html - HTML 字符串
         * @returns {Array<string>} 图片 URL 数组
         */
        extractImageUrls(html) {
            const urls = [];
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
            let match;

            while ((match = imgRegex.exec(html)) !== null) {
                const src = match[1];
                // 跳过已经是 Base64 的图片
                if (!src.startsWith('data:')) {
                    urls.push(src);
                }
            }

            return urls;
        },

        /**
         * 判断是否为本地图片
         * @param {string} url - 图片 URL
         * @returns {boolean}
         */
        isLocalImage(url) {
            const currentHost = window.location.hostname;
            const apiHost = window.AppConfig?.API_BASE_URL?.replace(/^https?:\/\//, '').replace('/api', '') || '';

            return (
                url.startsWith('/uploads/') ||
                url.startsWith(`http://${currentHost}`) ||
                url.startsWith('http://localhost') ||
                url.startsWith('http://127.0.0.1') ||
                url.includes(apiHost)
            );
        },

        /**
         * 获取图片的 MIME 类型
         * @param {string} src - 图片 URL 或 Base64
         * @returns {string} MIME 类型
         */
        getImageMimeType(src) {
            if (src.startsWith('data:')) {
                const match = src.match(/^data:([^;]+);/);
                return match ? match[1] : 'image/png';
            }

            const ext = src.split('.').pop().toLowerCase().split('?')[0];
            const mimeMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'bmp': 'image/bmp',
                'webp': 'image/webp',
                'svg': 'image/svg+xml'
            };

            return mimeMap[ext] || 'image/png';
        }
    };

    // 暴露到全局
    window.WordExportImageProcessor = ImageProcessor;
})();

