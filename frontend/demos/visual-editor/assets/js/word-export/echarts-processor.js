/**
 * ECharts 图表处理器
 * 将 ECharts 图表转换为图片以便导出到 Word
 */

const WordExportEChartsProcessor = {
    /**
     * 检测并收集页面中的 ECharts 图表
     * @param {Document} dom - DOM 文档
     * @returns {Array} 图表信息数组
     */
    detectCharts(dom) {
        const charts = [];

        console.log('[ECharts] 开始检测图表...');

        // 方法1: 查找包含 canvas 的容器（echarts 默认使用 canvas 渲染）
        const containers = dom.querySelectorAll('div[_echarts_instance_], div[data-echarts], .echarts-container');
        console.log(`[ECharts] 方法1: 找到 ${containers.length} 个候选容器`);

        containers.forEach((container, index) => {
            const canvas = container.querySelector('canvas');
            console.log(`[ECharts] 容器 ${index + 1}: id="${container.id}", canvas=${!!canvas}`);
            if (canvas) {
                const chartInfo = {
                    index: index,
                    container: container,
                    canvas: canvas,
                    id: container.id || `echarts-${index}`,
                    width: container.offsetWidth || parseInt(container.style.width) || 600,
                    height: container.offsetHeight || parseInt(container.style.height) || 400
                };
                charts.push(chartInfo);
                console.log(`[ECharts] ✅ 添加图表: ${chartInfo.id} (${chartInfo.width}x${chartInfo.height})`);
            }
        });

        // 方法2: 查找所有 canvas，检查是否是 echarts 实例
        if (typeof window !== 'undefined' && window.echarts) {
            const allCanvases = dom.querySelectorAll('canvas');
            console.log(`[ECharts] 方法2: 找到 ${allCanvases.length} 个 canvas 元素`);
            allCanvases.forEach((canvas, index) => {
                const container = canvas.parentElement;
                if (container && !charts.find(c => c.container === container)) {
                    // 检查是否是 echarts 实例
                    const instanceId = container.getAttribute('_echarts_instance_');
                    if (instanceId || this.isEChartsCanvas(canvas)) {
                        const chartInfo = {
                            index: charts.length,
                            container: container,
                            canvas: canvas,
                            id: container.id || `echarts-auto-${index}`,
                            width: canvas.width || container.offsetWidth || 600,
                            height: canvas.height || container.offsetHeight || 400
                        };
                        charts.push(chartInfo);
                        console.log(`[ECharts] ✅ 添加图表 (方法2): ${chartInfo.id}`);
                    }
                }
            });
        } else {
            console.log('[ECharts] ⚠️ echarts 对象不可用，跳过方法2');
        }

        console.log(`[ECharts] 检测完成: 共找到 ${charts.length} 个图表`);
        return charts;
    },

    /**
     * 判断 canvas 是否是 ECharts 图表
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @returns {boolean} 是否是 ECharts 图表
     */
    isEChartsCanvas(canvas) {
        // 检查 canvas 的父容器是否有 echarts 相关属性
        const parent = canvas.parentElement;
        if (!parent) return false;

        // 检查各种可能的标识
        return parent.hasAttribute('_echarts_instance_') ||
               parent.hasAttribute('data-echarts') ||
               parent.classList.contains('echarts-container') ||
               parent.id.includes('echarts') ||
               parent.id.includes('chart');
    },

    /**
     * 将图表转换为图片
     * @param {Object} chartInfo - 图表信息
     * @param {Object} options - 转换选项
     * @returns {Promise<Object>} 转换结果
     */
    async convertChartToImage(chartInfo, options = {}) {
        try {
            console.log(`[ECharts] 转换图表 ${chartInfo.id}...`);
            console.log(`[ECharts] 图表信息:`, {
                id: chartInfo.id,
                width: chartInfo.width,
                height: chartInfo.height,
                hasContainer: !!chartInfo.container,
                hasCanvas: !!chartInfo.canvas
            });

            const {
                container,
                canvas,
                width,
                height
            } = chartInfo;

            // 方法0: 检查是否有预先提取的图表数据
            const preExtractedData = container.getAttribute('data-echarts-image');
            if (preExtractedData) {
                const preWidth = parseInt(container.getAttribute('data-echarts-width')) || width;
                const preHeight = parseInt(container.getAttribute('data-echarts-height')) || height;

                console.log(`[ECharts] ✅ 图表 ${chartInfo.id} 使用预提取数据，dataURL 长度: ${preExtractedData.length}`);
                return {
                    success: true,
                    dataURL: preExtractedData,
                    width: preWidth,
                    height: preHeight,
                    format: 'png'
                };
            }

            // 方法1: 如果能访问 echarts 实例，使用 getDataURL
            const echartsObj = options.echartsInstance || window.echarts;
            if (echartsObj) {
                const instanceId = container.getAttribute('_echarts_instance_');
                console.log(`[ECharts] 方法1: instanceId="${instanceId}"`);
                if (instanceId) {
                    try {
                        // 使用提供的或全局的 echarts 对象获取实例
                        const instance = echartsObj.getInstanceById(instanceId);

                        console.log(`[ECharts] 方法1: instance=${!!instance}`);
                        if (instance) {
                            const dataURL = instance.getDataURL({
                                type: options.format || 'png',
                                pixelRatio: options.pixelRatio || 2,
                                backgroundColor: options.backgroundColor || '#ffffff'
                            });

                            console.log(`[ECharts] ✅ 图表 ${chartInfo.id} 转换成功 (方法1: echarts API)，dataURL 长度: ${dataURL.length}`);
                            return {
                                success: true,
                                dataURL: dataURL,
                                width: width,
                                height: height,
                                format: options.format || 'png'
                            };
                        }
                    } catch (err) {
                        console.warn(`[ECharts] ⚠️ 方法1失败，尝试方法2:`, err.message);
                    }
                }
            } else {
                console.log('[ECharts] ⚠️ echarts 对象不可用，跳过方法1');
            }

            // 方法2: 直接从 canvas 获取 dataURL
            console.log(`[ECharts] 尝试方法2: canvas=${!!canvas}, toDataURL=${!!(canvas && canvas.toDataURL)}`);
            if (canvas && canvas.toDataURL) {
                try {
                    const dataURL = canvas.toDataURL('image/png', 1.0);

                    console.log(`[ECharts] ✅ 图表 ${chartInfo.id} 转换成功 (方法2: canvas API)，dataURL 长度: ${dataURL.length}`);
                    return {
                        success: true,
                        dataURL: dataURL,
                        width: width,
                        height: height,
                        format: 'png'
                    };
                } catch (err) {
                    console.warn(`[ECharts] ⚠️ 方法2失败:`, err.message);
                }
            }

            // 方法3: 创建新的 canvas 并绘制
            if (canvas) {
                try {
                    const newCanvas = document.createElement('canvas');
                    newCanvas.width = width;
                    newCanvas.height = height;
                    const ctx = newCanvas.getContext('2d');

                    // 白色背景
                    ctx.fillStyle = options.backgroundColor || '#ffffff';
                    ctx.fillRect(0, 0, width, height);

                    // 绘制原始 canvas
                    ctx.drawImage(canvas, 0, 0, width, height);

                    const dataURL = newCanvas.toDataURL('image/png', 1.0);

                    console.log(`[ECharts] 图表 ${chartInfo.id} 转换成功 (方法3: 重新绘制)`);
                    return {
                        success: true,
                        dataURL: dataURL,
                        width: width,
                        height: height,
                        format: 'png'
                    };
                } catch (err) {
                    console.warn(`[ECharts] 方法3失败:`, err.message);
                }
            }

            throw new Error('所有转换方法都失败');

        } catch (error) {
            console.error(`[ECharts] 图表 ${chartInfo.id} 转换失败:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 替换图表为图片元素
     * @param {Object} chartInfo - 图表信息
     * @param {string} dataURL - 图片 Base64 数据
     * @returns {HTMLImageElement} 图片元素
     */
    replaceChartWithImage(chartInfo, dataURL) {
        const { container, width, height, id } = chartInfo;

        // 创建 img 元素
        const img = document.createElement('img');
        img.src = dataURL;
        img.alt = `图表: ${id}`;
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        img.style.maxWidth = '100%';
        img.setAttribute('data-chart-id', id);
        img.setAttribute('data-original-type', 'echarts');

        // 保留原始容器的样式
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.margin) {
            img.style.margin = computedStyle.margin;
        }
        if (computedStyle.display === 'block') {
            img.style.display = 'block';
        }

        // 替换容器
        container.parentNode.replaceChild(img, container);

        console.log(`[ECharts] 图表 ${id} 已替换为图片`);
        return img;
    },

    /**
     * 处理所有图表
     * @param {Document} dom - DOM 文档
     * @param {Object} options - 处理选项
     * @returns {Promise<Object>} 处理结果
     */
    async processAllCharts(dom, options = {}) {
        const charts = this.detectCharts(dom);

        if (charts.length === 0) {
            console.log('[ECharts] 没有检测到图表');
            return {
                total: 0,
                success: 0,
                failed: 0
            };
        }

        console.log(`[ECharts] 开始处理 ${charts.length} 个图表...`);

        const results = {
            total: charts.length,
            success: 0,
            failed: 0,
            images: []
        };

        for (let i = 0; i < charts.length; i++) {
            const chart = charts[i];

            try {
                console.log(`[ECharts] 处理图表 ${i + 1}/${charts.length}: ${chart.id}`);

                // 转换为图片
                const result = await this.convertChartToImage(chart, options);

                if (result.success) {
                    // 替换为 img 元素
                    const img = this.replaceChartWithImage(chart, result.dataURL);
                    results.success++;
                    results.images.push(img);
                    console.log(`[ECharts] 图表 ${i + 1}/${charts.length}: 完成`);
                } else {
                    results.failed++;
                    console.error(`[ECharts] 图表 ${i + 1}/${charts.length}: 失败 - ${result.error}`);
                }

            } catch (error) {
                results.failed++;
                console.error(`[ECharts] 图表 ${i + 1}/${charts.length}: 异常`, error);
            }

            // 避免阻塞 UI
            if (i < charts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        console.log(`[ECharts] 处理完成: ${results.success} 成功, ${results.failed} 失败`);
        return results;
    },

    /**
     * 创建图表占位符（用于无法转换的图表）
     * @param {Object} chartInfo - 图表信息
     * @returns {HTMLDivElement} 占位符元素
     */
    createPlaceholder(chartInfo) {
        const { width, height, id } = chartInfo;

        const placeholder = document.createElement('div');
        placeholder.style.width = `${width}px`;
        placeholder.style.height = `${height}px`;
        placeholder.style.border = '2px dashed #ccc';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.backgroundColor = '#f5f5f5';
        placeholder.style.color = '#999';
        placeholder.style.fontSize = '14px';
        placeholder.textContent = `[图表: ${id}]`;
        placeholder.setAttribute('data-chart-id', id);
        placeholder.setAttribute('data-original-type', 'echarts-placeholder');

        return placeholder;
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.WordExportEChartsProcessor = WordExportEChartsProcessor;
}

