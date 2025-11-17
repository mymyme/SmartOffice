# AI局部编辑预览优化

## 🎯 优化内容

### 问题1：预览中echarts图表不显示
**现象**: AI局部编辑弹窗的预览区域无法显示echarts图表，但应用后在实时预览中可以正常显示

### 问题2：标题颜色
**需求**: "AI局部编辑"弹窗标题改为白色

---

## 🔍 问题1分析：预览中Script不执行

### 根本原因

**原代码**:
```javascript
// ❌ 问题代码
function showLocalEditPreview(modifiedCode) {
    const previewBox = document.getElementById('local-preview-box');
    previewBox.innerHTML = modifiedCode;  // ← 使用innerHTML，script不会执行
    previewSection.style.display = 'block';
}
```

**为什么不显示？**
- 使用`innerHTML`设置HTML时，浏览器出于安全考虑**不会执行**其中的`<script>`标签
- echarts图表需要执行JavaScript代码来初始化
- 所以预览区只显示了图表容器（空的div），但没有渲染图表

### 修复方案

**修复后**:
```javascript
// ✅ 修复后
function showLocalEditPreview(modifiedCode) {
    const previewBox = document.getElementById('local-preview-box');

    // 清空预览区
    previewBox.innerHTML = '';

    // 创建临时容器来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modifiedCode;

    // 提取script标签
    const scripts = tempDiv.querySelectorAll('script');
    const scriptContents = [];
    const scriptSrcs = [];

    scripts.forEach(script => {
        if (script.src) {
            scriptSrcs.push(script.src);  // CDN链接
        } else if (script.textContent) {
            scriptContents.push(script.textContent);  // 初始化代码
        }
        script.remove();
    });

    // 先插入HTML内容（不包括script）
    previewBox.appendChild(tempDiv);

    // 加载外部脚本
    if (totalScripts > 0) {
        scriptSrcs.forEach(src => {
            const scriptElement = document.createElement('script');
            scriptElement.src = src;
            scriptElement.onload = () => {
                // 所有外部脚本加载完成后执行内联脚本
                if (++loadedScripts === totalScripts) {
                    executeInlineScripts();
                }
            };
            document.head.appendChild(scriptElement);
        });
    } else {
        // 没有外部脚本，直接执行内联脚本
        executeInlineScripts();
    }
}
```

### 工作流程

```
1. AI返回HTML（包含echarts的script标签）
   ↓
2. 解析HTML，提取script标签
   - 外部脚本：https://cdn.jsdelivr.net/npm/echarts@5/...
   - 内联脚本：echarts.init(...)初始化代码
   ↓
3. 先插入HTML容器（图表的div）
   ↓
4. 加载外部脚本（echarts库）
   ↓
5. 等待加载完成
   ↓
6. 执行内联脚本（初始化图表）
   ↓
7. ✅ echarts图表成功渲染在预览中
```

---

## 🎨 问题2修复：标题颜色

### CSS修改

**修改前**:
```css
.local-edit-header h2 {
    font-size: 20px;
    margin: 0;
    /* color可能被其他样式覆盖 */
}
```

**修改后**:
```css
.local-edit-header h2 {
    font-size: 20px;
    margin: 0;
    color: white !important;  /* ← 使用!important确保优先级 */
}
```

---

## 📊 修复对比

### 预览中的echarts显示

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| AI生成echarts代码 | ❌ 预览区空白 | ✅ 预览区显示图表 |
| 应用到实时预览 | ✅ 正常显示 | ✅ 正常显示 |
| script标签执行 | ❌ 不执行 | ✅ 正确执行 |
| CDN加载 | ❌ 不加载 | ✅ 正确加载 |

### 标题颜色

| 元素 | 修复前 | 修复后 |
|------|--------|--------|
| "AI局部编辑"标题 | ⚠️ 可能不是白色 | ✅ 白色 |

---

## 🔧 技术要点

### 1. script标签提取

```javascript
// 分别处理外部脚本和内联脚本
const scripts = tempDiv.querySelectorAll('script');

scripts.forEach(script => {
    if (script.src) {
        // 外部脚本（如echarts CDN）
        scriptSrcs.push(script.src);
    } else if (script.textContent) {
        // 内联脚本（如初始化代码）
        scriptContents.push(script.textContent);
    }
    script.remove();  // 从HTML中移除，稍后单独处理
});
```

### 2. 异步加载处理

```javascript
// 确保外部脚本加载完成后再执行内联脚本
let loadedScripts = 0;
const totalScripts = scriptSrcs.length;

scriptElement.onload = () => {
    loadedScripts++;
    if (loadedScripts === totalScripts) {
        setTimeout(executeInlineScripts, 100);  // 等待100ms确保库完全初始化
    }
};
```

### 3. 避免重复加载

```javascript
// 检查脚本是否已经加载过
const existingScript = document.querySelector(`script[src="${src}"]`);
if (existingScript) {
    console.log('[预览] 脚本已存在，跳过:', src);
    loadedScripts++;
    return;
}
```

### 4. 在正确的上下文中执行

```javascript
// 创建script元素并添加到预览容器
const scriptElement = document.createElement('script');
scriptElement.textContent = content;
previewBox.appendChild(scriptElement);  // ← 添加到预览容器中执行
```

---

## 🧪 测试场景

### 测试1: echarts柱状图预览

```
步骤：
1. 清除缓存（Ctrl+Shift+R）
2. 选中一个元素
3. 点击"AI编辑"
4. 输入："添加一个echarts柱状图"
5. 等待AI生成

预期结果：
✅ 预览区显示图表
✅ 控制台显示：[预览] 脚本加载成功: echarts CDN
✅ 控制台显示：[预览] 内联脚本已执行
✅ 图表可交互（鼠标悬停显示数据）
```

### 测试2: echarts饼图预览

```
步骤：
1. 选中元素
2. 输入："替换为一个饼图"
3. 查看预览

预期结果：
✅ 预览区显示饼图
✅ 应用后实时预览也正常
```

### 测试3: 标题颜色

```
步骤：
1. 打开AI局部编辑对话框
2. 查看标题

预期结果：
✅ "✏️ AI局部编辑"标题为白色
✅ 对比明显，易于识别
```

---

## 🔍 调试方法

### 1. 检查script是否加载

在控制台查看：
```
[预览] 脚本加载成功: https://cdn.jsdelivr.net/npm/echarts@5/...
[预览] 内联脚本已执行
```

### 2. 检查echarts对象

```javascript
// 在控制台输入
console.log('echarts:', window.echarts);
```

应该输出：
```
echarts: {init: ƒ, connect: ƒ, ...}
```

### 3. 检查图表容器

```javascript
const previewBox = document.getElementById('local-preview-box');
const chartDiv = previewBox.querySelector('[id*="chart"]');
console.log('图表容器:', chartDiv);
console.log('容器尺寸:', chartDiv?.offsetWidth, chartDiv?.offsetHeight);
```

### 4. 检查标题颜色

```javascript
const h2 = document.querySelector('.local-edit-header h2');
console.log('标题颜色:', window.getComputedStyle(h2).color);
```

应该输出：
```
标题颜色: rgb(255, 255, 255)  // 白色
```

---

## 💡 使用建议

### 预览echarts图表

```
1. 输入指令要具体
   ✅ "添加一个echarts柱状图，显示最近7天的销售数据"
   ❌ "添加图表"

2. 等待预览加载
   - 看到"生成预览中..."
   - 等待图表渲染完成
   - 检查图表是否可交互

3. 确认无误后应用
   - 查看预览中的效果
   - 确认数据和样式
   - 点击"应用修改"
```

### 常见问题

**Q: 预览区图表显示不完整？**
```
A: 可能是容器尺寸问题，AI生成时会设置：
   <div id="chart" style="width: 600px; height: 400px;"></div>
   可以在指令中指定："添加800x600的柱状图"
```

**Q: 应用后图表消失？**
```
A: 检查是否有echarts CDN冲突
   - 刷新页面
   - 重新生成
   - 检查控制台错误
```

---

## ✅ 优化完成

**优化状态**: ✅ 已完成

### 修复的问题
- ✅ 预览区可以显示echarts图表
- ✅ script标签正确执行
- ✅ 外部库正确加载
- ✅ 标题颜色改为白色

### 现在支持
- ✅ 预览echarts柱状图
- ✅ 预览echarts饼图
- ✅ 预览echarts折线图
- ✅ 预览其他需要JavaScript的组件
- ✅ 更好的视觉效果

---

## 📝 实现细节

### showLocalEditPreview函数流程

```javascript
showLocalEditPreview(modifiedCode)
  ↓
解析HTML，提取scripts
  ↓
插入HTML内容（不含script）
  ↓
加载外部脚本（echarts CDN）
  ├─ 检查是否已加载
  ├─ 创建script标签
  ├─ 设置onload回调
  └─ 添加到document.head
  ↓
等待所有外部脚本加载完成
  ↓
执行内联脚本（echarts.init...）
  ├─ 创建script标签
  ├─ 设置textContent
  └─ 添加到预览容器
  ↓
✅ echarts图表渲染完成
```

---

## 🎉 总结

### 核心改进

1. **Script执行机制**
   - 提取script标签
   - 异步加载外部库
   - 按顺序执行初始化代码

2. **预览功能增强**
   - 支持echarts等需要JavaScript的组件
   - 实时渲染图表
   - 与实时预览效果一致

3. **视觉优化**
   - 标题颜色统一为白色
   - 更好的对比度

### 用户价值

- ✅ 所见即所得
- ✅ 预览效果准确
- ✅ 减少应用后的意外
- ✅ 更好的用户体验

---

**文档版本**: v1.0
**最后更新**: 2025年11月17日
**状态**: ✅ 已优化

