# Chrome风格元素选择功能说明

## 🎯 功能概述

在可视化编辑器的实时预览中实现了类似Chrome开发者工具的元素选择效果，提供两种选择模式：

1. **文本选择模式** - 传统的拖拽选中文本
2. **元素选择模式** - 点击选中整个DOM元素（类似Chrome DevTools）

---

## 🎨 视觉效果

### 1. 元素悬停效果

当鼠标悬停在元素上时：

```
外观特征：
- 蓝色半透明边框（rgba(101, 175, 255, 0.8)）
- 浅蓝色半透明背景（rgba(101, 175, 255, 0.1)）
- 光标变为pointer
- 0.15s平滑过渡动画
```

**元素标签提示**：
```
位置：元素左上角
内容：标签名.类名 宽×高
示例：div.container 1200×600
样式：蓝色背景，白色文字，等宽字体
```

### 2. 元素选中效果

点击元素后：

```
外观特征：
- 深蓝色边框（#1a73e8）
- 极浅蓝色背景（rgba(26, 115, 232, 0.08)）
- 持久显示元素标签
- 弹出浮动工具栏
```

**浮动工具栏**：
```
位置：选中元素上方居中
内容：AI编辑 | 插入图片 | 样式 | 删除
样式：深色渐变背景，圆角，阴影
```

---

## 🖱️ 交互逻辑

### 模式切换

```
启用预览编辑后：
1. 鼠标移动 → 悬停高亮 + 显示标签
2. 点击元素 → 选中高亮 + 显示工具栏
3. 拖拽文本 → 文本选择模式（工具栏仍可用）
```

### 元素悬停

```javascript
// 触发条件
✅ 启用预览编辑
✅ 鼠标移入元素
❌ 鼠标在工具栏上
❌ 元素已被选中

// 效果
- 添加 .preview-element-hover 类
- 显示元素标签（标签名、类名、尺寸）
- 移出后自动清除
```

### 元素选中

```javascript
// 触发条件
✅ 启用预览编辑
✅ 点击元素
❌ 点击 body/html

// 效果
- 清除之前的选中
- 添加 .preview-selection-highlight 类
- 显示元素标签（持久化）
- 显示浮动工具栏
- 保存 selectedElement 和 selectedRange
```

### 取消选中

```javascript
// 触发条件
✅ 点击其他元素
✅ 点击空白区域（非工具栏）
✅ 点击 Escape 键（可扩展）

// 效果
- 移除高亮类
- 删除元素标签
- 隐藏工具栏
- 清除 selectedElement
```

---

## 🎨 样式类说明

### .preview-element-hover

**用途**: 鼠标悬停时的临时高亮

```css
.preview-element-hover {
    outline: 2px solid rgba(101, 175, 255, 0.8) !important;
    outline-offset: 0px !important;
    background: rgba(101, 175, 255, 0.1) !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}
```

**特点**：
- 浅蓝色，表示"可交互"
- 快速过渡动画
- 自动清除

### .preview-selection-highlight

**用途**: 元素选中后的持久高亮

```css
.preview-selection-highlight {
    outline: 2px solid #1a73e8 !important;
    outline-offset: 0px !important;
    background: rgba(26, 115, 232, 0.08) !important;
    position: relative !important;
}
```

**特点**：
- 深蓝色，表示"已选中"
- 持久显示，需手动清除
- position: relative 用于定位标签

### .element-tag-tooltip

**用途**: 显示元素信息的标签

```css
.element-tag-tooltip {
    position: absolute;
    top: -24px;
    left: 0;
    background: #1a73e8;
    color: white;
    padding: 2px 6px;
    border-radius: 2px;
    font-size: 11px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-weight: 500;
    pointer-events: none;
    z-index: 10000;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

**智能定位**：
```javascript
// 如果标签超出视口顶部，自动移到下方
if (tagRect.top < 0) {
    tag.style.top = 'auto';
    tag.style.bottom = '-24px';
}
```

---

## 📋 元素标签格式

### 标签内容构成

```javascript
标签文本格式：
tagname[#id][.class1.class2] width×height

示例：
div 800×600
div#header 1200×80
div.container.main 1000×500
span.text.highlight 120×24
img 300×200
```

### 信息提取逻辑

```javascript
// 1. 标签名（必有）
let tagText = element.tagName.toLowerCase(); // 'div'

// 2. ID（如果有）
if (element.id) {
    tagText += '#' + element.id; // 'div#header'
}

// 3. 类名（最多2个，过滤内部类）
const classes = element.className.split(' ')
    .filter(c => c && !c.startsWith('preview-'))
    .slice(0, 2);
if (classes.length > 0) {
    tagText += '.' + classes.join('.'); // 'div#header.main'
}

// 4. 尺寸（必有）
const rect = element.getBoundingClientRect();
tagText += ` ${Math.round(rect.width)}×${Math.round(rect.height)}`;
// 'div#header.main 1200×80'
```

---

## 🔧 核心函数

### handleElementHover(e)

**功能**: 处理元素悬停高亮

```javascript
作用：
1. 检查是否启用预览编辑
2. 检查鼠标是否在工具栏上
3. 检查元素是否已选中
4. 移除之前的悬停效果
5. 添加新的悬停效果
6. 显示元素标签
```

### handleElementHoverOut(e)

**功能**: 处理元素悬停移出

```javascript
作用：
1. 移除 .preview-element-hover 类
2. 删除元素标签
```

### handleElementClick(e)

**功能**: 处理元素点击选中

```javascript
作用：
1. 检查是否启用预览编辑
2. 获取点击的元素
3. 过滤 body/html
4. 高亮选中的元素
5. 保存选中信息（selectedElement, selectedRange）
6. 显示浮动工具栏
```

### showElementTag(element)

**功能**: 显示元素标签提示

```javascript
作用：
1. 移除已存在的标签
2. 创建新标签元素
3. 构建标签文本（标签名、ID、类名、尺寸）
4. 添加到元素内部
5. 智能定位（超出视口时调整）
```

### highlightElement(element)

**功能**: 高亮选中的元素

```javascript
作用：
1. 清除之前的高亮
2. 移除悬停样式
3. 添加选中高亮样式
4. 显示元素标签（持久化）
5. 记录日志
```

### clearElementHighlight()

**功能**: 清除元素高亮

```javascript
作用：
1. 查找所有高亮元素
2. 移除高亮类
3. 删除选中属性
4. 删除元素标签
```

---

## 🎯 使用场景

### 场景1: 快速选中元素编辑

```
用户操作：
1. 启用预览编辑
2. 鼠标悬停在段落上
   → 看到蓝色高亮 + "p.text 600×80"
3. 点击段落
   → 深蓝色高亮 + 工具栏
4. 点击"AI编辑"
   → 打开AI对话框

体验：
✅ 可视化选择，精准定位
✅ 实时反馈，所见即所得
✅ 流畅交互，操作简单
```

### 场景2: 精确插入图片

```
用户操作：
1. 启用预览编辑
2. 悬停并点击目标位置的元素
3. 点击"📷 插入图片"
4. 选择图片并插入
   → 图片插入到选中元素后

体验：
✅ 位置精准，符合预期
✅ 标签提示，清晰明了
```

### 场景3: 快速删除元素

```
用户操作：
1. 悬停在不需要的元素上
   → 看到标签 "div.banner 1200×300"
2. 点击选中
3. 点击"删除"
   → 元素被移除

体验：
✅ 快速识别，准确删除
✅ 二次确认，避免误删
```

---

## 🔍 技术细节

### 事件监听

```javascript
// 在iframe加载完成后添加
iframeDoc.addEventListener('mouseover', handleElementHover);
iframeDoc.addEventListener('mouseout', handleElementHoverOut);
iframeDoc.addEventListener('click', handleElementClick);
iframeDoc.addEventListener('contextmenu', handleContextMenu);
```

### 样式隔离

```javascript
// 使用 !important 确保样式优先级
outline: 2px solid #1a73e8 !important;
background: rgba(26, 115, 232, 0.08) !important;

// 过滤内部类名
.filter(c => c && !c.startsWith('preview-'))
```

### 防止冲突

```javascript
// 悬停时，如果已选中，不显示悬停效果
if (hoveredElement.classList.contains('preview-selection-highlight')) {
    return;
}

// 避免在工具栏上触发
if (e.target.closest('.floating-toolbar')) {
    return;
}
```

### 智能定位

```javascript
// 工具栏根据选中类型智能定位
if (selectedElement && selectedElement.getBoundingClientRect) {
    rect = selectedElement.getBoundingClientRect(); // 元素模式
} else {
    rect = range.getBoundingClientRect(); // 文本模式
}
```

---

## 📊 效果对比

### 修改前

| 特性 | 状态 | 用户体验 |
|------|------|----------|
| 悬停提示 | ❌ 无 | ⚠️ 不知道能点哪 |
| 选中反馈 | ⚠️ 虚线 | ⚠️ 不明显 |
| 元素信息 | ❌ 无 | ⚠️ 不清楚是什么 |
| 工具栏定位 | ⚠️ 简单 | ⚠️ 有时不准 |

### 修改后

| 特性 | 状态 | 用户体验 |
|------|------|----------|
| 悬停提示 | ✅ 蓝色高亮 + 标签 | ✅ 清晰可见 |
| 选中反馈 | ✅ 深蓝色边框 | ✅ 非常明显 |
| 元素信息 | ✅ 标签名尺寸 | ✅ 信息完整 |
| 工具栏定位 | ✅ 智能定位 | ✅ 精准跟随 |

---

## 🎨 视觉参考

### Chrome DevTools风格

本实现参考了Chrome开发者工具的元素选择器：

```
相似之处：
✅ 悬停时的蓝色高亮
✅ 选中时的深蓝色边框
✅ 元素标签提示（标签名、类名、尺寸）
✅ 平滑的过渡动画
✅ 智能的定位逻辑

增强之处：
✨ 集成浮动工具栏
✨ 支持AI编辑功能
✨ 支持图片插入
✨ 支持样式调整
✨ 支持元素删除
```

---

## 🧪 测试场景

### 测试1: 悬停效果

```
步骤：
1. 启用预览编辑
2. 鼠标移动到各种元素上
3. 观察高亮效果和标签

预期：
✅ 悬停时显示浅蓝色高亮
✅ 显示元素标签（标签名.类名 宽×高）
✅ 移出后高亮消失
✅ 标签内容准确
```

### 测试2: 选中效果

```
步骤：
1. 点击一个元素
2. 观察选中效果
3. 点击另一个元素

预期：
✅ 选中时显示深蓝色边框
✅ 持久显示元素标签
✅ 显示浮动工具栏
✅ 切换选中时清除之前的高亮
```

### 测试3: 标签定位

```
步骤：
1. 选中页面顶部的元素
2. 选中页面底部的元素
3. 选中窄小的元素

预期：
✅ 顶部元素标签正常显示
✅ 底部元素标签正常显示
✅ 窄小元素标签不超出
✅ 超出视口时自动调整位置
```

### 测试4: 工具栏定位

```
步骤：
1. 选中不同位置的元素
2. 观察工具栏位置

预期：
✅ 工具栏显示在元素上方
✅ 居中对齐
✅ 不超出屏幕边缘
✅ 空间不足时显示下方
```

---

## 🚀 使用方法

### 启用功能

```
1. 点击顶部工具栏的"启用预览编辑"按钮
   → 按钮变为"禁用预览编辑"

2. 鼠标移动到预览区
   → 自动显示悬停高亮

3. 点击任意元素
   → 选中并显示工具栏
```

### 元素操作

```
选中元素后可以：

1. AI编辑
   - 点击"✏️ AI编辑"
   - 输入修改指令
   - AI生成修改方案

2. 插入图片
   - 点击"📷 插入图片"
   - 选择图片
   - 插入到选中位置

3. 样式调整
   - 点击"🎨 样式"
   - 输入CSS样式
   - 应用到元素

4. 删除元素
   - 点击"🗑️ 删除"
   - 确认删除
   - 元素被移除
```

---

## 💡 最佳实践

### 1. 选择合适的元素

```
✅ 推荐选择：
- 段落（p）
- 容器（div）
- 标题（h1-h6）
- 列表项（li）
- 图片（img）

⚠️ 避免选择：
- body、html
- 脚本、样式标签
- 隐藏元素
```

### 2. 利用标签信息

```
标签信息帮助你：
- 确认元素类型
- 查看元素类名
- 了解元素尺寸
- 避免选错元素
```

### 3. 结合文本选择

```
两种模式可以互补：
- 元素选择：适合整体修改
- 文本选择：适合局部修改
```

---

## 🎉 总结

### 核心特性

1. ✅ **Chrome风格高亮** - 悬停和选中双重反馈
2. ✅ **元素标签提示** - 显示标签名、类名、尺寸
3. ✅ **智能工具栏** - 自动定位，不遮挡内容
4. ✅ **流畅动画** - 0.15s平滑过渡
5. ✅ **双模式支持** - 元素选择 + 文本选择

### 用户体验提升

- 🎨 视觉效果更专业
- 🎯 选择更精准
- 📋 信息更完整
- ⚡ 交互更流畅
- 🔍 识别更容易

---

**文档版本**: v1.0
**最后更新**: 2025年11月17日
**状态**: ✅ 已完成

