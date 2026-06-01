/**
 * ECharts 导出辅助函数
 * 在预览窗口中提前提取图表数据
 */

(function() {
    'use strict';

    // 在预览窗口中提取所有 ECharts 图表数据
    window.extractEChartsData = function() {
        if (typeof echarts === 'undefined') {
            console.log('[ECharts辅助] echarts 未加载');
            return 0;
        }

        let count = 0;
        const containers = document.querySelectorAll('[data-echarts], [_echarts_instance_], .echarts-container');

        console.log(`[ECharts辅助] 找到 ${containers.length} 个图表容器`);

        containers.forEach((container, index) => {
            const instanceId = container.getAttribute('_echarts_instance_');
            if (instanceId) {
                try {
                    const instance = echarts.getInstanceById(instanceId);
                    if (instance) {
                        // 获取图表的 dataURL
                        const dataURL = instance.getDataURL({
                            type: 'png',
                            pixelRatio: 2,
                            backgroundColor: '#ffffff'
                        });

                        // 存储到容器的 data 属性中
                        container.setAttribute('data-echarts-image', dataURL);
                        container.setAttribute('data-echarts-width', container.offsetWidth || 600);
                        container.setAttribute('data-echarts-height', container.offsetHeight || 400);

                        count++;
                        console.log(`[ECharts辅助] ✅ 提取图表 ${container.id || index}: ${dataURL.length} bytes`);
                    }
                } catch (error) {
                    console.warn(`[ECharts辅助] ⚠️ 提取图表 ${container.id || index} 失败:`, error);
                }
            }
        });

        console.log(`[ECharts辅助] 共提取 ${count} 个图表数据`);
        return count;
    };

})();

