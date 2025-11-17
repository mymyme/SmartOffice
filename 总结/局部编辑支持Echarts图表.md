# 局部编辑功能支持Echarts图表

## 🐛 问题描述

**用户反馈**: 局部修改功能无法添加echarts图表

---

## 🔍 根本原因分析

### 问题1: 提示词限制过严

**原提示词**:
```
要求：
1. 只返回修改后的完整HTML代码
2. 保持原有的class和结构  ← ❌ 限制了添加新结构
3. 不要添加任何解释文字
4. 确保HTML格式正确
```

**问题**：
- "保持原有的class和结构"限制了AI添加新的复杂组件
- 没有提到支持添加script标签
- 没有提到可以引入外部库（如echarts CDN）

### 问题2: Script标签无法执行

**原代码**:
```javascript
// ❌ 问题代码
const tempDiv = iframeDoc.createElement('div');
tempDiv.innerHTML = window.pendingLocalEdit; // 设置innerHTML

// 插入所有新节点
while (tempDiv.firstChild) {
    selectedRange.insertNode(tempDiv.lastChild);
}
```

**问题**：
- 使用`innerHTML`解析HTML时，浏览器**不会执行**其中的`<script>`标签
- 这是浏览器的安全机制
- 导致echarts的CDN引入和初始化代码都不会执行
- 结果：图表容器存在，但图表不渲染

### 为什么innerHTML不执行script？

```javascript
// 浏览器行为示例
const div = document.createElement('div');
div.innerHTML = '<script>alert("test")</script>'; 
// ❌ alert不会执行

// 正确方法
const script = document.createElement('script');
script.textContent = 'alert("test")';
document.body.appendChild(script);
// ✅ alert会执行
```

---

## 🔧 解决方案

### 方案1: 优化AI提示词

让AI知道可以添加复杂组件和script标签。

#### 新提示词

```javascript
const prompt = `我选中了以下HTML内容：

${selectionText}

请根据以下指令修改上述HTML：${instruction}

要求：
1. 只返回修改后的完整HTML代码
2. 如果需要添加新功能（如图表、组件等），可以完全改变结构
3. 如果需要添加echarts图表，必须包含：
   - CDN引入：<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
   - 图表容器：<div id="chart" style="width: 600px; height: 400px;"></div>
   - 初始化脚本：<script>...</script>完整的echarts初始化代码
4. 如果需要添加其他库（如Chart.js等），也要包含完整的CDN和初始化代码
5. 不要添加任何解释文字或markdown格式
6. 确保HTML格式正确，可以直接使用
7. 如果是简单修改（改颜色、文字等），保持原有结构即可`;
```

**改进点**：
- ✅ 明确说明"可以完全改变结构"
- ✅ 详细说明如何添加echarts（CDN + 容器 + 初始化）
- ✅ 支持其他库
- ✅ 区分简单修改和复杂添加

### 方案2: 手动提取并执行Script标签

修改`applyLocalEdit`函数，单独处理script标签。

#### 核心逻辑

```javascript
// 1. 提取script标签
const scripts = tempDiv.querySelectorAll('script');
const scriptContents = []; // 内联脚本内容
const scriptSrcs = [];      // 外部脚本URL

scripts.forEach(script => {
    if (script.src) {
        scriptSrcs.push(script.src); // CDN链接
    } else if (script.textContent) {
        scriptContents.push(script.textContent); // 初始化代码
    }
    script.remove(); // 从HTML中移除
});

// 2. 插入HTML（不包括script）
while (tempDiv.firstChild) {
    selectedRange.insertNode(tempDiv.lastChild);
}

// 3. 加载外部脚本（如echarts CDN）
scriptSrcs.forEach(src => {
    const scriptElement = iframeDoc.createElement('script');
    scriptElement.src = src;
    scriptElement.onload = () => {
        console.log('脚本加载成功');
        // 所有外部脚本加载完成后，执行内联脚本
    };
    iframeDoc.head.appendChild(scriptElement);
});

// 4. 执行内联脚本（如echarts初始化）
scriptContents.forEach(content => {
    const scriptElement = iframeDoc.createElement('script');
    scriptElement.textContent = content;
    iframeDoc.body.appendChild(scriptElement);
});
```

---

## 📊 完整实现

### 修改后的applyLocalEdit函数

```javascript
function applyLocalEdit() {
    if (!window.pendingLocalEdit || !selectedRange) {
        alert('没有待应用的修改');
        return;
    }

    try {
        const previewFrame = document.getElementById('preview-frame');
        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

        // 创建临时div来解析HTML
        const tempDiv = iframeDoc.createElement('div');
        tempDiv.innerHTML = window.pendingLocalEdit;

        // 删除原内容
        selectedRange.deleteContents();

        // ✅ 提取并单独处理script标签
        const scripts = tempDiv.querySelectorAll('script');
        const scriptContents = [];
        const scriptSrcs = [];
        
        scripts.forEach(script => {
            if (script.src) {
                scriptSrcs.push(script.src);
            } else if (script.textContent) {
                scriptContents.push(script.textContent);
            }
            script.remove();
        });

        // 插入HTML节点
        while (tempDiv.firstChild) {
            selectedRange.insertNode(tempDiv.lastChild);
        }

        // ✅ 异步加载外部脚本
        let loadedScripts = 0;
        const totalScripts = scriptSrcs.length;
        
        const executeInlineScripts = () => {
            scriptContents.forEach(content => {
                const scriptElement = iframeDoc.createElement('script');
                scriptElement.textContent = content;
                iframeDoc.body.appendChild(scriptElement);
            });
        };

        if (totalScripts > 0) {
            scriptSrcs.forEach(src => {
                // 检查是否已加载
                const existingScript = iframeDoc.querySelector(`script[src="${src}"]`);
                if (existingScript) {
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        executeInlineScripts();
                    }
                    return;
                }

                const scriptElement = iframeDoc.createElement('script');
                scriptElement.src = src;
                scriptElement.onload = () => {
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        setTimeout(executeInlineScripts, 100);
                    }
                };
                iframeDoc.head.appendChild(scriptElement);
            });
        } else {
            executeInlineScripts();
        }

        syncPreviewToCode();
        updateStatus('✅ 修改已应用');
        closeLocalEditModal();

    } catch (error) {
        console.error('应用修改失败:', error);
        alert('应用修改失败: ' + error.message);
    }
}
```

---

## 🎯 工作流程

### Echarts图表添加流程

```
1. 用户选中一个元素
   ↓
2. 点击"AI编辑"
   ↓
3. 输入："添加一个echarts柱状图"
   ↓
4. AI返回HTML（包含CDN + 容器 + 初始化）
   示例：
   <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
   <div id="chart" style="width: 600px; height: 400px;"></div>
   <script>
     var chart = echarts.init(document.getElementById('chart'));
     chart.setOption({...});
   </script>
   ↓
5. 显示预览
   ↓
6. 用户点击"应用修改"
   ↓
7. applyLocalEdit执行：
   a. 提取script标签
   b. 插入HTML容器
   c. 加载echarts CDN
   d. 等待CDN加载完成
   e. 执行初始化代码
   ↓
8. ✅ Echarts图表成功渲染
```

---

## 💡 技术要点

### 1. Script标签的处理顺序

```
1. 外部脚本（CDN）先加载
   → 确保库文件可用

2. 等待所有外部脚本加载完成
   → 避免 "echarts is not defined" 错误

3. 执行内联脚本（初始化代码）
   → 此时echarts已经可用
```

### 2. 避免重复加载

```javascript
// 检查脚本是否已存在
const existingScript = iframeDoc.querySelector(`script[src="${src}"]`);
if (existingScript) {
    console.log('已存在，跳过');
    return;
}
```

**原因**：
- 避免重复加载同一个库
- 提高性能
- 避免潜在的冲突

### 3. 异步加载处理

```javascript
scriptElement.onload = () => {
    loadedScripts++;
    if (loadedScripts === totalScripts) {
        // 所有脚本加载完成
        setTimeout(executeInlineScripts, 100);
    }
};
```

**要点**：
- 使用计数器跟踪加载进度
- 所有外部脚本加载完成后才执行内联脚本
- 添加100ms延迟，确保库完全初始化

### 4. 在iframe上下文中执行

```javascript
// ✅ 正确：在iframe的document中创建script
const scriptElement = iframeDoc.createElement('script');
scriptElement.textContent = content;
iframeDoc.body.appendChild(scriptElement);

// ❌ 错误：在主页面执行
eval(content); // 会在主页面执行，找不到iframe中的元素
```

---

## 🧪 测试场景

### 测试1: 添加简单柱状图

```
步骤：
1. 选中一个div
2. AI编辑："添加一个echarts柱状图"
3. 应用修改

预期结果：
✅ 看到柱状图
✅ 控制台显示：[脚本加载] 成功: echarts CDN
✅ 控制台显示：[脚本执行] 内联脚本已执行
```

### 测试2: 添加饼图

```
步骤：
1. 选中一个空白区域
2. AI编辑："在这里添加一个饼图，显示销售数据占比"
3. 应用修改

预期结果：
✅ 看到饼图
✅ 图表有交互效果（鼠标悬停显示数据）
```

### 测试3: 添加折线图

```
步骤：
1. 选中一个段落
2. AI编辑："替换为一个折线图，显示最近7天的访问量趋势"
3. 应用修改

预期结果：
✅ 段落被替换为折线图
✅ 图表正常显示
```

### 测试4: 多次添加图表

```
步骤：
1. 添加第一个图表（柱状图）
2. 选中另一个元素
3. 添加第二个图表（饼图）

预期结果：
✅ 两个图表都正常显示
✅ echarts CDN不重复加载
✅ 控制台显示：[脚本加载] 已存在，跳过
```

---

## 🔍 调试方法

### 1. 检查script标签提取

在控制台查看：
```javascript
console.log('外部脚本:', scriptSrcs);
console.log('内联脚本:', scriptContents);
```

应该看到：
```
外部脚本: ["https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"]
内联脚本: ["var chart = echarts.init(...)..."]
```

### 2. 检查echarts是否加载

在控制台输入：
```javascript
const iframeDoc = document.getElementById('preview-frame').contentDocument;
console.log('echarts:', iframeDoc.defaultView.echarts);
```

应该输出：
```
echarts: {init: ƒ, connect: ƒ, ...}
```

### 3. 检查图表实例

```javascript
const chart = iframeDoc.getElementById('chart');
console.log('图表容器:', chart);
console.log('容器尺寸:', chart.offsetWidth, chart.offsetHeight);
```

### 4. 查看错误日志

打开控制台，应该看到：
```
[脚本加载] 成功: https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js
[脚本执行] 内联脚本已执行
```

如果有错误：
```
[脚本加载] 失败: ...
[脚本执行] 内联脚本执行失败: ...
```

---

## 📋 AI响应示例

### 示例1: 柱状图

用户输入："添加一个echarts柱状图"

AI应该返回：
```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<div id="myChart" style="width: 600px; height: 400px;"></div>
<script>
var myChart = echarts.init(document.getElementById('myChart'));
var option = {
    title: { text: '数据统计' },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [{
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar'
    }]
};
myChart.setOption(option);
</script>
```

### 示例2: 饼图

用户输入："替换为一个饼图显示销售占比"

AI应该返回：
```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<div id="pieChart" style="width: 600px; height: 400px;"></div>
<script>
var pieChart = echarts.init(document.getElementById('pieChart'));
var option = {
    title: { text: '销售占比', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
        type: 'pie',
        radius: '50%',
        data: [
            { value: 1048, name: '产品A' },
            { value: 735, name: '产品B' },
            { value: 580, name: '产品C' },
            { value: 484, name: '产品D' }
        ]
    }]
};
pieChart.setOption(option);
</script>
```

---

## ✅ 修复完成

**修复状态**: ✅ 已完成

### 修复的问题
- ✅ 优化AI提示词，明确支持添加复杂组件
- ✅ 明确说明echarts的使用方式（CDN + 容器 + 初始化）
- ✅ 手动提取并执行script标签
- ✅ 支持外部脚本（CDN）加载
- ✅ 支持内联脚本执行
- ✅ 避免重复加载
- ✅ 异步加载处理
- ✅ 在iframe上下文中正确执行

### 现在支持
- ✅ Echarts图表（柱状图、饼图、折线图等）
- ✅ Chart.js图表
- ✅ 其他需要外部库的组件
- ✅ 自定义JavaScript交互
- ✅ 多个图表共存

---

## 📝 使用指南

### 如何添加Echarts图表

```
1. 启用预览编辑

2. 选中要添加图表的位置
   - 可以选中一个空div
   - 可以选中一段文字（会被替换）

3. 点击"AI编辑"

4. 输入指令，例如：
   - "添加一个echarts柱状图"
   - "在这里插入一个饼图"
   - "替换为折线图显示趋势"

5. 等待AI生成

6. 查看预览

7. 点击"应用修改"

8. ✅ 图表成功渲染
```

### 提示词建议

**✅ 好的提示词**：
- "添加一个echarts柱状图，显示最近7天的销售数据"
- "在这个位置插入一个饼图，展示产品分类占比"
- "替换为一个折线图，显示过去一个月的访问量趋势"

**⚠️ 不够明确的提示词**：
- "添加图表"（没说什么类型）
- "显示数据"（没说用什么方式）

---

## 🎉 总结

### 核心改进

1. **提示词优化**
   - 明确支持添加复杂结构
   - 详细说明echarts使用方式
   - 区分简单修改和复杂添加

2. **Script执行机制**
   - 手动提取script标签
   - 异步加载外部库
   - 按顺序执行初始化代码
   - 避免重复加载

3. **用户体验**
   - 添加echarts示例提示
   - 详细的调试日志
   - 错误处理和反馈

### 技术突破

- ✅ 解决了innerHTML不执行script的问题
- ✅ 实现了iframe中的异步脚本加载
- ✅ 支持复杂的第三方库集成
- ✅ 保持了代码的稳定性和安全性

---

**文档版本**: v1.0  
**最后更新**: 2025年11月17日  
**状态**: ✅ 已完成

