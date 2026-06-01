/**
 * Word 导出布局优化模块
 * 将复杂的 CSS 布局转换为 Word 支持的格式
 */

(function() {
    'use strict';

    const LayoutOptimizer = {
        /**
         * 优化整个文档布局
         * @param {Document} dom - DOM 文档
         * @returns {Document} 优化后的 DOM
         */
        optimizeLayout(dom) {
            // 1. 转换 Flexbox 布局
            this.convertFlexboxToTable(dom);

            // 2. 转换 Grid 布局
            this.convertGridToTable(dom);

            // 3. 处理绝对定位
            this.handleAbsolutePositioning(dom);

            // 4. 移除空容器
            this.removeEmptyContainers(dom);

            // 5. 扁平化深层嵌套
            this.flattenNestedDivs(dom);

            return dom;
        },

        /**
         * Flexbox 布局转表格
         * @param {Document} dom - DOM 文档
         */
        convertFlexboxToTable(dom) {
            const flexContainers = Array.from(dom.querySelectorAll('*')).filter(el => {
                const styles = WordExportUtils.getComputedStyle(el);
                return styles.display === 'flex' || styles.display === 'inline-flex';
            });

            flexContainers.forEach(container => {
                try {
                    const styles = WordExportUtils.getComputedStyle(container);
                    const isColumn = styles.flexDirection === 'column' ||
                                   styles.flexDirection === 'column-reverse';
                    const isReverse = styles.flexDirection?.includes('reverse');

                    // 创建表格
                    const table = dom.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.setAttribute('data-from-flexbox', 'true');

                    // 复制边框和背景样式
                    if (styles.border) table.style.border = styles.border;
                    if (styles.backgroundColor) table.style.backgroundColor = styles.backgroundColor;

                    const children = Array.from(container.children);
                    if (isReverse) children.reverse();

                    if (isColumn) {
                        // 纵向布局：每个子元素一行
                        children.forEach(child => {
                            const tr = dom.createElement('tr');
                            const td = dom.createElement('td');
                            td.style.padding = '4px';
                            td.appendChild(child.cloneNode(true));
                            tr.appendChild(td);
                            table.appendChild(tr);
                        });
                    } else {
                        // 横向布局：所有子元素一行
                        const tr = dom.createElement('tr');
                        const childCount = children.length;

                        children.forEach(child => {
                            const td = dom.createElement('td');
                            td.style.width = `${100 / childCount}%`;
                            td.style.padding = '4px';

                            // 保留子元素的对齐方式
                            const childStyles = WordExportUtils.getComputedStyle(child);
                            if (childStyles.textAlign) {
                                td.style.textAlign = childStyles.textAlign;
                            }

                            td.appendChild(child.cloneNode(true));
                            tr.appendChild(td);
                        });

                        table.appendChild(tr);
                    }

                    // 替换原容器
                    container.parentNode.replaceChild(table, container);

                    console.log('[布局优化] Flexbox → Table:', isColumn ? '纵向' : '横向');
                } catch (error) {
                    console.error('[布局优化] Flexbox 转换失败:', error);
                }
            });
        },

        /**
         * Grid 布局转表格
         * @param {Document} dom - DOM 文档
         */
        convertGridToTable(dom) {
            const gridContainers = Array.from(dom.querySelectorAll('*')).filter(el => {
                const styles = WordExportUtils.getComputedStyle(el);
                return styles.display === 'grid' || styles.display === 'inline-grid';
            });

            gridContainers.forEach(container => {
                try {
                    const styles = WordExportUtils.getComputedStyle(container);
                    const children = Array.from(container.children);

                    // 尝试解析 grid-template-columns
                    let columns = 1;
                    if (styles.gridTemplateColumns) {
                        columns = styles.gridTemplateColumns.split(' ').length;
                    }

                    // 创建表格
                    const table = dom.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.setAttribute('data-from-grid', 'true');

                    // 将子元素分行
                    let currentRow = null;
                    children.forEach((child, index) => {
                        if (index % columns === 0) {
                            currentRow = dom.createElement('tr');
                            table.appendChild(currentRow);
                        }

                        const td = dom.createElement('td');
                        td.style.padding = '4px';
                        td.appendChild(child.cloneNode(true));
                        currentRow.appendChild(td);
                    });

                    // 填充最后一行的空单元格
                    if (currentRow && currentRow.children.length < columns) {
                        const remaining = columns - currentRow.children.length;
                        for (let i = 0; i < remaining; i++) {
                            const td = dom.createElement('td');
                            currentRow.appendChild(td);
                        }
                    }

                    // 替换原容器
                    container.parentNode.replaceChild(table, container);

                    console.log('[布局优化] Grid → Table:', `${columns} 列`);
                } catch (error) {
                    console.error('[布局优化] Grid 转换失败:', error);
                }
            });
        },

        /**
         * 处理绝对定位元素
         * @param {Document} dom - DOM 文档
         */
        handleAbsolutePositioning(dom) {
            const positioned = Array.from(dom.querySelectorAll('*')).filter(el => {
                const styles = WordExportUtils.getComputedStyle(el);
                return styles.position === 'absolute' || styles.position === 'fixed';
            });

            positioned.forEach(element => {
                try {
                    const styles = WordExportUtils.getComputedStyle(element);

                    // 记录位置信息（作为数据属性，供后续处理）
                    element.setAttribute('data-float-x', styles.left || '0');
                    element.setAttribute('data-float-y', styles.top || '0');
                    element.setAttribute('data-float-z', styles.zIndex || '0');

                    // 转换为相对定位或静态定位
                    element.style.position = 'relative';

                    console.log('[布局优化] 绝对定位 → 相对定位');
                } catch (error) {
                    console.error('[布局优化] 定位处理失败:', error);
                }
            });
        },

        /**
         * 移除空容器
         * @param {Document} dom - DOM 文档
         */
        removeEmptyContainers(dom) {
            const containers = Array.from(dom.querySelectorAll('div, section, article'));
            let removed = 0;

            containers.forEach(container => {
                try {
                    // 检查是否为空（没有文本内容，没有子元素，或只有空白）
                    const isEmpty = !container.textContent.trim() &&
                                  container.children.length === 0;

                    if (isEmpty && container.parentNode) {
                        container.parentNode.removeChild(container);
                        removed++;
                    }
                } catch (error) {
                    // 忽略错误，继续处理
                }
            });

            if (removed > 0) {
                console.log(`[布局优化] 移除 ${removed} 个空容器`);
            }
        },

        /**
         * 扁平化深层嵌套的 div
         * @param {Document} dom - DOM 文档
         */
        flattenNestedDivs(dom) {
            let flattened = 0;

            const flattenNode = (node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                const tagName = node.tagName.toLowerCase();

                // 只处理 div 和 section
                if (tagName !== 'div' && tagName !== 'section') return;

                const children = Array.from(node.children);

                // 如果只有一个子元素，且也是 div/section，则提升子元素
                if (children.length === 1) {
                    const child = children[0];
                    const childTag = child.tagName.toLowerCase();

                    if ((childTag === 'div' || childTag === 'section') && node.parentNode) {
                        // 复制父元素的样式到子元素
                        const parentStyles = node.getAttribute('style') || '';
                        const childStyles = child.getAttribute('style') || '';

                        if (parentStyles && !childStyles) {
                            child.setAttribute('style', parentStyles);
                        }

                        // 替换父元素
                        node.parentNode.replaceChild(child, node);
                        flattened++;

                        // 递归处理新的子元素
                        flattenNode(child);
                        return;
                    }
                }

                // 递归处理子元素
                children.forEach(child => flattenNode(child));
            };

            flattenNode(dom.body);

            if (flattened > 0) {
                console.log(`[布局优化] 扁平化 ${flattened} 层嵌套`);
            }
        },

        /**
         * 优化表格结构
         * @param {Document} dom - DOM 文档
         */
        optimizeTables(dom) {
            const tables = dom.querySelectorAll('table');

            tables.forEach(table => {
                try {
                    // 确保有 tbody
                    if (!table.querySelector('tbody')) {
                        const tbody = dom.createElement('tbody');
                        Array.from(table.children).forEach(child => {
                            if (child.tagName.toLowerCase() === 'tr') {
                                tbody.appendChild(child);
                            }
                        });
                        table.appendChild(tbody);
                    }

                    // 设置默认样式
                    if (!table.style.borderCollapse) {
                        table.style.borderCollapse = 'collapse';
                    }

                    if (!table.style.width) {
                        table.style.width = '100%';
                    }

                    console.log('[布局优化] 表格结构优化');
                } catch (error) {
                    console.error('[布局优化] 表格优化失败:', error);
                }
            });
        },

        /**
         * 处理浮动元素
         * @param {Document} dom - DOM 文档
         */
        handleFloats(dom) {
            const floated = Array.from(dom.querySelectorAll('*')).filter(el => {
                const styles = WordExportUtils.getComputedStyle(el);
                return styles.float !== 'none';
            });

            floated.forEach(element => {
                try {
                    const styles = WordExportUtils.getComputedStyle(element);
                    const float = styles.float;

                    // 记录浮动方向
                    element.setAttribute('data-float-direction', float);

                    // 转换为对齐方式
                    if (float === 'left') {
                        element.style.textAlign = 'left';
                    } else if (float === 'right') {
                        element.style.textAlign = 'right';
                    }

                    // 清除浮动
                    element.style.float = 'none';

                    console.log('[布局优化] 浮动 → 对齐:', float);
                } catch (error) {
                    console.error('[布局优化] 浮动处理失败:', error);
                }
            });
        },

        /**
         * 简化复杂选择器（移除不必要的嵌套）
         * @param {Document} dom - DOM 文档
         */
        simplifyStructure(dom) {
            // 移除仅用于样式的 span 包裹
            const spans = dom.querySelectorAll('span');

            spans.forEach(span => {
                try {
                    // 如果 span 没有实际样式，且只有一个文本节点子元素
                    const hasStyle = span.getAttribute('style') ||
                                   span.className ||
                                   span.id;

                    if (!hasStyle && span.childNodes.length === 1 &&
                        span.firstChild.nodeType === Node.TEXT_NODE) {
                        // 用文本节点替换 span
                        const textNode = dom.createTextNode(span.textContent);
                        span.parentNode.replaceChild(textNode, span);
                    }
                } catch (error) {
                    // 忽略错误
                }
            });
        }
    };

    // 暴露到全局
    window.WordExportLayoutOptimizer = LayoutOptimizer;
})();

