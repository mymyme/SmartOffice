// 从 constants.js 导入的全局配置
const { AI_API_TYPE, DIFY_API_URL, DIFY_API_KEY, OPENAI_API_URL, OPENAI_API_KEY, OPENAI_MODEL, API_BASE_URL, APP_VERSION, VERSION_KEY, LAST_UPDATE_KEY, isRemoteAccess } = window.AppConfig;

let editor, updateTimeout, syncTimeout;
let conversationId = ''; // Dify 会话 ID
let autoInsertCode = true; // 自动插入代码到编辑器
let showCodeBlocks = false;
let toolbarExpanded = false; // 显示代码块开关
let isGeneratingCode = false;
let abortController = null; // 用于中断生成的控制器 // 是否正在生成代码

// ==================== 版本管理相关变量 ====================
let versionManager = null; // 版本管理器实例
let currentEditingBlockId = null; // 当前正在编辑的代码块ID
let lastSavedContent = ''; // 上次保存的内容（用于比较是否有未保存的更改）

// 生成唯一的事件blockId
function generateTempBlockId() {
    return 'manual_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 处理编辑器内容变化 - 自动启用保存按钮
function handleEditorContentChange() {
    if (!editor) return;

    const currentContent = editor.getValue();

    // 如果当前没有编辑的代码块ID，自动创建一个
    if (!currentEditingBlockId) {
        currentEditingBlockId = generateTempBlockId();
        console.log('[版本管理] 已生成临时blockId:', currentEditingBlockId);

        // 初始化版本管理器中的这个代码块
        if (versionManager) {
            versionManager.versions[currentEditingBlockId] = {
                versions: [],
                currentVersion: 0
            };
        }

        // 保存初始内容作为对比基准
        lastSavedContent = currentContent;
    }

    // 启用保存按钮
    setSaveButtonEnabled(true);
    console.log('[版本管理] 检测到编辑，已启用保存按钮');
}

// ==================== SVG图标辅助函数 - Iconfont风格（白色） ====================
const SVG_ICONS = {
    robot: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M300 328c-22.1 0-40 17.9-40 40v160c0 22.1 17.9 40 40 40s40-17.9 40-40V368c0-22.1-17.9-40-40-40z m424 0c-22.1 0-40 17.9-40 40v160c0 22.1 17.9 40 40 40s40-17.9 40-40V368c0-22.1-17.9-40-40-40z"/><path d="M852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32z m-32 660H204V128h616v596z"/><path d="M300 624h424v64H300z m60 192h304v64H360z"/><path d="M512 896c35.3 0 64-28.7 64-64h-128c0 35.3 28.7 64 64 64z"/></svg>',
    arrowUp: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3c-3.8 5.3-0.1 12.7 6.5 12.7h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z"/></svg>',
    arrowDown: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3 0.1-12.7-6.4-12.7z"/></svg>',
    arrowLeft: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8c-16.4 12.8-16.4 37.5 0 50.3l450.8 352.1c5.3 4.1 12.9 0.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"/></svg>',
    arrowRight: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M765.7 486.8L314.9 134.7c-5.3-4.1-12.9-0.4-12.9 6.3v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1c16.4-12.8 16.4-37.6 0-50.4z"/></svg>',
    play: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m144.1 454.9L437.7 677.8c-4.1 2.6-9.7-0.2-9.7-5.1V351.3c0-4.8 5.5-7.7 9.7-5.1l218.4 158.8c3.8 2.8 3.8 8.5 0 11.2z"/></svg>',
    lock: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m280 560c0 4.4-3.6 8-8 8h-56v56c0 4.4-3.6 8-8 8h-56c-4.4 0-8-3.6-8-8v-56h-56c-4.4 0-8-3.6-8-8v-56c0-4.4 3.6-8 8-8h56v-56c0-4.4 3.6-8 8-8h56c4.4 0 8 3.6 8 8v56h56c4.4 0 8 3.6 8 8v56z"/></svg>',
    edit: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M257.7 752c2 0 4-0.2 6-0.5L431.9 722c2-0.4 3.9-1.3 5.3-2.8l423.9-423.9c3.9-3.9 3.9-10.2 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2c-1.9 11.1 1.5 21.9 9.4 29.8 6.6 6.4 14.9 9.9 23.8 9.9z m67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89z"/><path d="M880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"/></svg>',
    clipboard: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M832 112H724V72c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v40H500V72c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v40H320c-17.7 0-32 14.3-32 32v120h-96c-17.7 0-32 14.3-32 32v568c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V296c0-17.7-14.3-32-32-32h-96V144c0-17.7-14.3-32-32-32z m-40 64v40H360v-40h432z m0 184v504H232V360h560z"/></svg>',
    plus: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M482 152h60c8.8 0 16 7.2 16 16v304h304c8.8 0 16 7.2 16 16v60c0 8.8-7.2 16-16 16H558v304c0 8.8-7.2 16-16 16h-60c-8.8 0-16-7.2-16-16V564H162c-8.8 0-16-7.2-16-16v-60c0-8.8 7.2-16 16-16h304V168c0-8.8 7.2-16 16-16z"/></svg>',
    check: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#52c41a" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m193.5 301.7l-210.6 292c-12.7 17.7-39 17.7-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"/></svg>',
    chat: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M573.7 765.6c143.2-26.5 252.3-152.4 252.3-304.1 0-169.7-141.1-307.2-315.2-307.2S195.6 291.8 195.6 461.5c0 94.8 44.7 179.5 114.5 235.3l-47.5 118.6 166.9-95.7c28.5 6.6 58.3 10.2 88.9 10.2 18.7 0 37.1-1.5 55.3-4.3z m-267-333c-25.9 0-46.9-21-46.9-46.9s21-46.9 46.9-46.9 46.9 21 46.9 46.9-21 46.9-46.9 46.9z m204.5 0c-25.9 0-46.9-21-46.9-46.9s21-46.9 46.9-46.9 46.9 21 46.9 46.9-21 46.9-46.9 46.9z m204.5 0c-25.9 0-46.9-21-46.9-46.9s21-46.9 46.9-46.9 46.9 21 46.9 46.9-21 46.9-46.9 46.9z"/></svg>',
    error: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#ff4d4f" width="1em" height="1em" style="vertical-align:-0.15em"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m165.4 618.2l-66-0.3L512 563.4l-99.3 118.4-66.1 0.3c-4.4 0-8-3.5-8-8 0-1.9 0.7-3.7 1.9-5.2l130.1-155L340.5 359c-1.2-1.5-1.9-3.3-1.9-5.2 0-4.4 3.6-8 8-8l66.1 0.3L512 464.6l99.3-118.4 66-0.3c4.4 0 8 3.5 8 8 0 1.9-0.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"/></svg>'
};

function getIcon(name) {
    return SVG_ICONS[name] || '';
}

// ==================== 预览模板优化相关变量 ====================
let previewTemplateReady = false; // 模板是否就绪
let pendingPreviewUpdate = null; // 待处理的预览更新
let lastPreviewCode = ''; // 上次预览的代码（用于增量更新检测）
// 模板模式默认关闭（脚本执行兼容性问题待解决）
// 可通过 window.setPreviewMode(true) 手动开启
let useTemplateMode = false;

// ==================== 会话管理 ====================
// 从localStorage恢复conversationId
const savedConversationId = localStorage.getItem('current_conversation_id');
if (savedConversationId) {
    conversationId = savedConversationId;
    console.log('[会话恢复] 已从localStorage恢复conversationId:', conversationId);
}

// 检查版本更新
function checkVersion() {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    const currentTime = new Date().getTime();

    console.log('[版本检查] 当前版本:', APP_VERSION);
    console.log('[版本检查] 本地版本:', savedVersion);

    if (!savedVersion || savedVersion !== APP_VERSION) {
        console.log('[版本检查] 检测到版本更新，清除缓存');

        // 保存重要数据（包括版本数据）
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const currentConvId = localStorage.getItem('current_conversation_id');

        // 保存所有版本数据
        const versionData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('code_block_versions_')) {
                versionData[key] = localStorage.getItem(key);
            }
        }

        // 清除所有localStorage（除了登录信息和版本数据）
        const tempData = {
            token: token,
            user: user,
            currentConvId: currentConvId,
            versionData: versionData
        };

        localStorage.clear();

        // 恢复登录信息
        if (tempData.token) localStorage.setItem('token', tempData.token);
        if (tempData.user) localStorage.setItem('user', tempData.user);
        if (tempData.currentConvId) localStorage.setItem('current_conversation_id', tempData.currentConvId);

        // 恢复版本数据
        Object.keys(tempData.versionData).forEach(key => {
            localStorage.setItem(key, tempData.versionData[key]);
        });

        console.log('[版本检查] 已保留版本数据:', Object.keys(tempData.versionData).length, '个会话');

        // 保存新版本号
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        localStorage.setItem(LAST_UPDATE_KEY, currentTime.toString());

        // 显示更新提示（已禁用）
        // if (savedVersion && savedVersion !== APP_VERSION) {
        //     showVersionUpdateNotice(savedVersion, APP_VERSION);
        // }
    } else {
        console.log('[版本检查] 版本一致，无需更新');
    }
}

// 显示版本更新通知
function showVersionUpdateNotice(oldVersion, newVersion) {
    const notice = document.createElement('div');
    notice.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 25px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
                z-index: 10000;
                font-family: 'Segoe UI', sans-serif;
                max-width: 400px;
                animation: slideInRight 0.5s ease-out;
            `;

    notice.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span style="font-size: 24px;">🎉</span>
                    <div>
                        <div style="font-weight: 700; font-size: 16px;">系统已更新</div>
                        <div style="font-size: 13px; opacity: 0.9;">Version ${oldVersion} → ${newVersion}</div>
                    </div>
                </div>
                <div style="font-size: 14px; line-height: 1.6; margin-bottom: 15px; opacity: 0.95;">
                    ✨ 缓存已清除，新功能已就绪！<br>
                    如遇到问题，请按 Ctrl+Shift+R 强制刷新页面。
                </div>
                <button onclick="this.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    width: 100%;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    我知道了
                </button>
            `;

    document.body.appendChild(notice);

    // 添加动画样式
    if (!document.getElementById('version-notice-style')) {
        const style = document.createElement('style');
        style.id = 'version-notice-style';
        style.textContent = `
                    @keyframes slideInRight {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `;
        document.head.appendChild(style);
    }

    // 10秒后自动关闭
    setTimeout(() => {
        if (notice.parentElement) {
            notice.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notice.remove(), 500);
        }
    }, 10000);
}

// 获取版本信息
function getVersionInfo() {
    return {
        version: APP_VERSION,
        lastUpdate: localStorage.getItem(LAST_UPDATE_KEY),
        buildDate: '2025-11-17'
    };
}

// 页面加载时检查版本
checkVersion();
console.log('[版本信息]', getVersionInfo());
// ==================== 版本管理结束 ====================

let isEditMode = false;
let isEditorVisible = false;
let isUpdatingFromPreview = false;
let isUpdatingFromEditor = false;
let currentUser = null;

// 撤销/重做相关变量
let previewHistory = [];
let previewHistoryIndex = -1;
const MAX_HISTORY_STEPS = 5;

// 处理认证失败（令牌过期）
function handleAuthenticationFailure(message = '您的登录状态已过期') {
    console.warn('[认证失败] 令牌已失效，正在跳转到登录页...');

    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;

    // 显示提示信息
    alert(message + '，请重新登录');

    // 延迟跳转，确保用户看到提示
    setTimeout(() => {
        window.location.href = './login.html';
    }, 100);
}

// 检查响应是否为认证失败
function isAuthenticationError(response, data) {
    // 检查 HTTP 状态码
    if (response.status === 401 || response.status === 403) {
        return true;
    }

    // 检查错误消息内容
    if (data && data.message) {
        const message = data.message.toLowerCase();
        const authErrorKeywords = [
            '认证令牌无效',
            '已过期',
            'token',
            'unauthorized',
            '未授权',
            'expired',
            '登录已过期',
            '请重新登录'
        ];

        return authErrorKeywords.some(keyword => message.includes(keyword));
    }

    return false;
}

// 通用 API 请求处理（自动处理认证失败）
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();

        // 检查是否认证失败
        if (isAuthenticationError(response, data)) {
            handleAuthenticationFailure();
            throw new Error('认证失败');
        }

        return { response, data };
    } catch (error) {
        // 如果不是认证错误，继续抛出
        if (error.message !== '认证失败') {
            throw error;
        }
        throw error;
    }
}

// 从服务器获取最新用户信息
async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok && data.success) {
            currentUser = data.data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('[用户信息] 已更新:', currentUser);
            return true;
        } else {
            console.error('[用户信息] 获取失败:', data.message);

            // 检查是否是认证失败
            if (isAuthenticationError(response, data)) {
                handleAuthenticationFailure();
            }

            return false;
        }
    } catch (error) {
        console.error('[用户信息] 获取错误:', error);
        return false;
    }
}

// 检查登录状态
async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log('[登录检查] Token:', token ? '存在' : '不存在');
    console.log('[登录检查] User:', user);

    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            console.log('[登录检查] 已登录用户:', currentUser.username);

            // 从服务器获取最新用户信息（包括头像）
            const updated = await fetchUserProfile();

            showUserMenu();
        } catch (e) {
            console.error('[登录检查] 解析用户信息失败:', e);
            showLoginButton();
        }
    } else {
        console.log('[登录检查] 未登录，显示登录按钮');
        showLoginButton();
    }
}

// 显示用户菜单
function showUserMenu() {
    const userMenu = document.getElementById('user-menu');
    const loginTrigger = document.getElementById('login-trigger');
    const userName = document.getElementById('user-name');
    const adminLink = document.getElementById('admin-link');
    const toolbarToggleBtn = document.getElementById('toolbar-toggle-btn');
    const toolbarButtons = document.getElementById('toolbar-buttons');

    console.log('[显示用户菜单] 开始执行, currentUser:', currentUser);

    if (userMenu && loginTrigger && currentUser) {
        userMenu.style.setProperty('display', 'flex', 'important');
        loginTrigger.style.setProperty('display', 'none', 'important');
        userName.textContent = currentUser.username;

        // 设置用户头像
        const userAvatarImg = document.getElementById('user-avatar-img');
        if (userAvatarImg && currentUser.avatar_url) {
            userAvatarImg.src = currentUser.avatar_url;
            console.log('[显示用户菜单] 设置用户头像:', currentUser.avatar_url);
        }

        console.log('[显示用户菜单] 已切换显示状态');
        console.log('[显示用户菜单] userMenu.display:', window.getComputedStyle(userMenu).display);
        console.log('[显示用户菜单] loginTrigger.display:', window.getComputedStyle(loginTrigger).display);

        // 如果是管理员，显示管理后台链接和工具栏按钮
        if (currentUser.role === 'admin') {
            if (adminLink) {
                adminLink.style.display = 'flex';
                console.log('[显示用户菜单] 显示管理员链接');
            }

            // 显示展开/收起按钮和工具栏
            if (toolbarToggleBtn) {
                toolbarToggleBtn.style.display = 'block';
                console.log('[显示用户菜单] 显示工具栏展开/收起按钮（管理员权限）');
            }
            if (toolbarButtons) {
                toolbarButtons.style.display = 'flex';
                console.log('[显示用户菜单] 启用工具栏功能（管理员权限）');
            }
        } else {
            // 非管理员，确保工具栏按钮隐藏
            if (toolbarToggleBtn) {
                toolbarToggleBtn.style.display = 'none';
            }
            if (toolbarButtons) {
                toolbarButtons.style.display = 'none';
            }
            console.log('[显示用户菜单] 普通用户，隐藏工具栏功能');
        }
    } else {
        console.error('[显示用户菜单] 元素或用户信息缺失', {
            userMenu: !!userMenu,
            loginTrigger: !!loginTrigger,
            currentUser: !!currentUser
        });
    }
}

// 显示登录按钮
function showLoginButton() {
    const userMenu = document.getElementById('user-menu');
    const loginTrigger = document.getElementById('login-trigger');
    const toolbarToggleBtn = document.getElementById('toolbar-toggle-btn');
    const toolbarButtons = document.getElementById('toolbar-buttons');

    console.log('[显示登录按钮] 开始执行');

    if (userMenu && loginTrigger) {
        userMenu.style.setProperty('display', 'none', 'important');
        loginTrigger.style.setProperty('display', 'flex', 'important');

        // 隐藏工具栏按钮（未登录或非管理员时）
        if (toolbarToggleBtn) {
            toolbarToggleBtn.style.display = 'none';
        }
        if (toolbarButtons) {
            toolbarButtons.style.display = 'none';
        }

        console.log('[显示登录按钮] 已切换显示状态，工具栏已隐藏');
        console.log('[显示登录按钮] userMenu.display:', window.getComputedStyle(userMenu).display);
        console.log('[显示登录按钮] loginTrigger.display:', window.getComputedStyle(loginTrigger).display);
    } else {
        console.error('[显示登录按钮] 元素缺失', {
            userMenu: !!userMenu,
            loginTrigger: !!loginTrigger
        });
    }
}

// 切换用户下拉菜单
function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 点击外部关闭下拉菜单
document.addEventListener('click', function (e) {
    const userMenu = document.getElementById('user-menu');
    const dropdown = document.getElementById('user-dropdown');

    if (dropdown && userMenu && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});


// 登出
async function logout() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
        }
    } catch (error) {
        console.error('登出错误:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        showLoginButton();
    }
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function () {
    console.log('[页面加载] DOM内容已加载完成，开始检查登录状态');

    // 调试信息
    const loginTrigger = document.getElementById('login-trigger');
    const userMenu = document.getElementById('user-menu');
    console.log('[调试] 登录按钮元素:', loginTrigger);
    console.log('[调试] 登录按钮显示状态:', loginTrigger ? window.getComputedStyle(loginTrigger).display : 'null');
    console.log('[调试] 用户菜单元素:', userMenu);
    console.log('[调试] 用户菜单显示状态:', userMenu ? window.getComputedStyle(userMenu).display : 'null');

    checkLoginStatus();

    // 初始化预览区选中监听
    initPreviewSelection();
    console.log('[功能] 预览区选中监听已初始化');

    // 初始化版本管理器
    initVersionManagement();
    console.log('[功能] 版本管理器已初始化');
});

// 提取代码块（支持markdown格式和纯文本）
function extractCode(text) {
    // 尝试提取markdown代码块
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
        // 返回所有代码块，用换行分隔
        return matches.map(m => m[1].trim()).join('\n\n');
    }

    // 如果没有代码块标记，检查是否包含HTML标签
    if (text.includes('<') && text.includes('>')) {
        return text;
    }

    // 否则返回原文本
    return text;
}

// 插入到编辑器
function insertToEditor(content) {
    const code = extractCode(content);
    const currentCode = editor.getValue();
    const position = editor.getPosition();

    // 询问用户插入方式
    const action = confirm('点击"确定"替换全部代码\n点击"取消"在光标位置插入');

    if (action) {
        // 替换全部代码
        editor.setValue(code);
        updateStatus('已替换编辑器内容');
    } else {
        // 在光标位置插入
        const line = position ? position.lineNumber : 1;
        const column = position ? position.column : 1;

        editor.executeEdits('insert-code', [{
            range: new monaco.Range(line, column, line, column),
            text: code
        }]);

        updateStatus('已在光标位置插入代码');
    }

    updatePreview();
}

// 复制到剪贴板
function copyToClipboard(text, button) {
    const code = extractCode(text);

    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '✅ 已复制';
        button.style.background = '#4CAF50';

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        updateStatus('复制失败: ' + err.message);
    });
}

// 自动插入到编辑器
function autoInsertToEditor(content) {
    if (!editor) {
        console.error('[ERROR] SmartOffice Editor not loaded yet');
        return;
    }
    const code = extractCode(content);

    // 只有当提取到的内容看起来像代码时才插入
    if (!looksLikeCode(code)) {
        console.log('Content does not appear to be code, skipping auto-insert');
        return;
    }

    const currentCode = editor.getValue();

    // 如果编辑器是空的或只有默认代码，直接替换
    if (!currentCode.trim() || currentCode === editor.getValue()) {
        editor.setValue(code);
        updateStatus('✅ 已自动插入代码到编辑器');
    } else {
        // 否则追加到末尾
        const lastLine = editor.getModel().getLineCount();
        const lastColumn = editor.getModel().getLineMaxColumn(lastLine);

        editor.executeEdits('auto-insert', [{
            range: new monaco.Range(lastLine, lastColumn, lastLine, lastColumn),
            text: '\n\n' + code
        }]);

        updateStatus('✅ 已自动追加代码到编辑器末尾');
    }

    updatePreview();

    // 滚动到插入的位置
    editor.revealLine(editor.getModel().getLineCount());
}

// 判断内容是否看起来像代码
function looksLikeCode(text) {
    // 检查是否包含代码特征
    const codePatterns = [
        /<[a-z][\s\S]*>/i,           // HTML标签
        /function\s+\w+\s*\(/,      // 函数定义
        /const\s+\w+\s*=/,          // const声明
        /let\s+\w+\s*=/,            // let声明
        /var\s+\w+\s*=/,            // var声明
        /class\s+\w+/,               // 类定义
        /\.\w+\s*\(/,              // 方法调用
        /\{[\s\S]*\}/,             // 代码块
        /if\s*\(/,                   // if语句
        /for\s*\(/,                  // for循环
        /while\s*\(/,                // while循环
        /```/                          // markdown代码块
    ];

    return codePatterns.some(pattern => pattern.test(text));
}

// 切换自动插入开关
function toggleAutoInsert() {
    autoInsertCode = !autoInsertCode;
    const btn = document.getElementById('auto-insert-toggle');
    if (btn) {
        btn.innerHTML = autoInsertCode ? getIcon('robot') + ' 自动插入: 开' : getIcon('robot') + ' 自动插入: 关';
        btn.style.background = autoInsertCode ? '#4CAF50' : '#f44336';
    }
    updateStatus(autoInsertCode ? '已开启自动插入' : '已关闭自动插入');
}


// 切换代码块显示
function toggleCodeBlocks() {
    showCodeBlocks = !showCodeBlocks;
    const btn = document.getElementById('code-block-toggle');
    if (btn) {
        btn.textContent = showCodeBlocks ? 'ð 显示代码块: 开' : 'ð 显示代码块: 关';
        btn.style.background = showCodeBlocks ? '#4CAF50' : '#f44336';
    }

    // 重新渲染所有消息
    const messages = document.querySelectorAll('.message-content');
    messages.forEach((msg, index) => {
        if (index > 0) {
            const originalContent = msg.getAttribute('data-original-content');
            if (originalContent) {
                const isGen = msg.getAttribute('data-is-generating') === 'true';
                const messageTimestamp = parseInt(msg.dataset.messageTimestamp) || null;
                msg.innerHTML = formatMessageContent(originalContent, isGen, messageTimestamp);
            }
        }
    });

    updateStatus(showCodeBlocks ? '已开启代码块显示' : '已关闭代码块显示');
}
let defaultCode = '';  // 将从外部文件加载
// 从外部文件加载默认代码
async function loadDefaultCode() {
    try {
        const response = await fetch('default-code-in-editor.html');
        if (response.ok) {
            defaultCode = await response.text();
            console.log('✅ 默认代码已从文件加载');
            return defaultCode;
        } else {
            console.error('❌ 加载默认代码失败:', response.status);
            return '';
        }
    } catch (error) {
        console.error('❌ 加载默认代码出错:', error);
        return '';
    }
}


function toggleToolbar() {
    toolbarExpanded = !toolbarExpanded;
    const btn = document.getElementById('toolbar-toggle-btn');
    const toolbar = document.getElementById('toolbar-buttons');

    if (toolbarExpanded) {
        toolbar.classList.remove('toolbar-buttons-collapsed');
        toolbar.classList.add('toolbar-buttons-expanded');
        btn.innerHTML = getIcon('arrowUp') + ' 收起';
        btn.style.background = '#FF9800';
    } else {
        toolbar.classList.remove('toolbar-buttons-expanded');
        toolbar.classList.add('toolbar-buttons-collapsed');
        btn.innerHTML = getIcon('arrowDown') + ' 展开';
        btn.style.background = '#2196F3';
    }
}

function handleSendClick() {
    if (isGeneratingCode) {
        stopGeneration();
    } else {
        // 检查登录状态
        if (!currentUser) {
            alert('请先登录后再使用 AI 对话助手功能');
            window.location.href = './login.html';
            return;
        }
        sendMessage();
    }
}
function stopGeneration() { if (abortController) { abortController.abort(); abortController = null; } isGeneratingCode = false; updateSendButton(); updateStatus('已停止生成'); }
function updateSendButton() { const btn = document.getElementById('send-btn'); if (!btn) return; if (isGeneratingCode) { btn.textContent = '停止'; btn.classList.add('stop-mode'); } else { btn.textContent = '发送'; btn.classList.remove('stop-mode'); } }

// ==================== 预览模板初始化 ====================

/**
 * 初始化预览模板iframe
 * 使用模板页预加载大型库，避免每次更新都重新加载
 */
function initPreviewTemplate() {
    const iframe = document.getElementById('preview-frame');
    if (!iframe) {
        console.error('[预览模板] iframe 元素不存在');
        return;
    }

    // 监听来自模板的消息
    window.addEventListener('message', handlePreviewMessage);

    // 加载模板页面
    iframe.src = 'preview-template.html';
    console.log('📦 [预览模板] 开始加载模板页面');

    // 设置超时检测（考虑到远程访问场景，给60秒超时）
    setTimeout(() => {
        if (!previewTemplateReady) {
            console.warn('[预览模板] 模板加载超时（60秒），切换到传统模式');
            useTemplateMode = false;
            // 如果有待处理的更新，使用传统方式
            if (pendingPreviewUpdate) {
                updatePreviewLegacy(pendingPreviewUpdate);
                pendingPreviewUpdate = null;
            }
        }
    }, 60000);
}

/**
 * 处理来自预览模板的消息
 */
function handlePreviewMessage(event) {
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
        case 'template-ready':
            previewTemplateReady = true;
            console.log('✅ [预览模板] 模板已就绪，库文件已缓存');
            // 处理待处理的更新
            if (pendingPreviewUpdate) {
                console.log('📤 [预览模板] 发送缓存的更新');
                sendToPreviewTemplate(pendingPreviewUpdate);
                pendingPreviewUpdate = null;
            }
            break;

        case 'preview-updated':
            console.log('✅ [预览模板] 预览更新完成');
            updateStatus('预览已更新');
            setTimeout(() => { isUpdatingFromEditor = false; }, 100);
            break;

        case 'content-response':
            // 处理从iframe返回的内容（用于同步到编辑器）
            if (data.content && !isUpdatingFromEditor) {
                handlePreviewContentSync(data.content);
            }
            break;

        case 'pong':
            // 心跳响应
            break;
    }
}

/**
 * 发送内容到预览模板
 */
function sendToPreviewTemplate(html) {
    const iframe = document.getElementById('preview-frame');
    if (!iframe || !iframe.contentWindow) {
        console.error('[预览模板] 无法访问 iframe');
        return;
    }

    iframe.contentWindow.postMessage({
        type: 'update-preview',
        html: html,
        mode: 'full'
    }, '*');
}

/**
 * 处理从预览同步回来的内容
 */
function handlePreviewContentSync(content) {
    // 这里可以处理从预览iframe同步回来的编辑内容
    console.log('[预览模板] 收到内容同步');
}

require.config({ paths: { 'vs': '/vs' } });
require(['vs/editor/editor.main'], async function () {
    await loadDefaultCode();
    editor = monaco.editor.create(document.getElementById('code-editor'), {
        value: defaultCode, language: 'html', theme: 'vs-dark', automaticLayout: true,
        minimap: { enabled: true }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false,
        wordWrap: 'on', tabSize: 2, formatOnPaste: true, formatOnType: true
    });
    editor.onDidChangeModelContent(() => {
        updateStatusBar();
        // 仅在用户手动编辑时触发预览更新
        // 如果是从预览同步或程序设置值，跳过自动更新
        if (!isUpdatingFromPreview && !isUpdatingFromEditor) {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => { updatePreview(); }, 500);

            // 自动创建临时blockId并启用保存按钮（如果还没有版本）
            handleEditorContentChange();
        }
    });

    // 初始化预览模板
    initPreviewTemplate();

    // 等待模板就绪后再更新预览
    setTimeout(() => {
        updatePreview();
    }, 100);

    updateStatus('编辑器已就绪 - 支持双向编辑');
});

/**
 * 更新预览 - 入口函数
 * 根据模板状态自动选择最优渲染方式
 */
function updatePreview() {
    if (isUpdatingFromPreview) return;

    console.time('⏱️ updatePreview总耗时');

    let code = editor.getValue();
    console.log('📊 HTML大小:', (code.length / 1024).toFixed(2), 'KB');

    // 预处理代码（CDN替换等）
    code = preprocessCode(code);

    // 根据模板状态选择渲染方式
    if (useTemplateMode && previewTemplateReady) {
        // 模板模式：通过postMessage发送更新
        console.log('🚀 [预览] 使用模板模式');
        sendToPreviewTemplate(code);
        console.timeEnd('⏱️ updatePreview总耗时');
    } else if (useTemplateMode && !previewTemplateReady) {
        // 模板尚未就绪，缓存更新（不要使用传统模式，否则会覆盖模板）
        console.log('⏳ [预览] 模板未就绪，缓存更新（等待库加载完成）');
        pendingPreviewUpdate = code;
        // 不结束计时器，等模板就绪后再结束
    } else {
        // 传统模式：直接设置srcdoc（仅在明确禁用模板模式时使用）
        console.log('📄 [预览] 使用传统模式');
        updatePreviewLegacy(code);
    }
}

/**
 * 预处理代码 - CDN替换、Markdown检测、库检测等
 */
function preprocessCode(code) {
    // 检测并转换 Markdown 内容
    if (typeof MarkdownRenderer !== 'undefined' && MarkdownRenderer.isMarkdown(code)) {
        const trimmedCode = code.trim();
        // 检查是否不是完整的HTML文档（避免误判HTML中包含Markdown语法的情况）
        const isNotHTML = !trimmedCode.toLowerCase().includes('<!doctype') &&
            !trimmedCode.toLowerCase().includes('<html') &&
            !trimmedCode.toLowerCase().includes('<body');

        if (isNotHTML) {
            console.log('📝 [预处理] 检测到 Markdown 格式，正在转换为 HTML...');
            const markdownHtml = MarkdownRenderer.parse(code);
            code = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown 预览</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Microsoft YaHei', sans-serif;
            line-height: 1.8;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
            color: #333;
            background-color: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        h1 { font-size: 2em; border-bottom: 2px solid #eaecef; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        h4 { font-size: 1em; }
        h5 { font-size: 0.875em; }
        h6 { font-size: 0.85em; color: #6a737d; }
        p { margin-bottom: 16px; }
        code {
            padding: 0.2em 0.4em;
            margin: 0;
            font-size: 85%;
            background-color: rgba(27,31,35,0.05);
            border-radius: 3px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        pre {
            padding: 16px;
            overflow: auto;
            font-size: 85%;
            line-height: 1.45;
            background-color: #f6f8fa;
            border-radius: 6px;
            margin-bottom: 16px;
        }
        pre code {
            background-color: transparent;
            border: 0;
            padding: 0;
        }
        blockquote {
            padding: 0 1em;
            color: #6a737d;
            border-left: 0.25em solid #dfe2e5;
            margin-bottom: 16px;
        }
        ul, ol {
            padding-left: 2em;
            margin-bottom: 16px;
        }
        li {
            margin-bottom: 0.25em;
        }
        table {
            border-spacing: 0;
            border-collapse: collapse;
            margin-bottom: 16px;
            width: 100%;
        }
        table th {
            font-weight: 600;
            padding: 6px 13px;
            border: 1px solid #dfe2e5;
            background-color: #f6f8fa;
        }
        table td {
            padding: 6px 13px;
            border: 1px solid #dfe2e5;
        }
        table tr:nth-child(2n) {
            background-color: #f6f8fa;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        img {
            max-width: 100%;
            box-sizing: border-box;
            border-radius: 6px;
            margin: 16px 0;
        }
        hr {
            height: 0.25em;
            padding: 0;
            margin: 24px 0;
            background-color: #e1e4e8;
            border: 0;
        }
        strong {
            font-weight: 600;
        }
        em {
            font-style: italic;
        }
        del {
            text-decoration: line-through;
        }
    </style>
</head>
<body class="markdown-content">
${markdownHtml}
</body>
</html>`;
            console.log('✅ [预处理] Markdown 转换完成');
        }
    }

    // 检查是否有外部资源链接
    const cdnRegex = /https?:\/\/[^\s"'<>]+\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf)/gi;
    let match;
    const cdnLinks = [];
    while ((match = cdnRegex.exec(code)) !== null) {
        cdnLinks.push(match[0]);
    }

    if (cdnLinks.length > 0) {
        console.warn('⚠️ 发现', cdnLinks.length, '个外部资源链接');
    }

    // 自动替换CDN链接为本地路径
    const beforeReplace = code;
    code = code.replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/echarts@[\d.]+\/dist\/echarts\.min\.js/gi, 'assets/libs/echarts.min.js');
    code = code.replace(/https?:\/\/unpkg\.com\/echarts@[\d.]+\/dist\/echarts\.min\.js/gi, 'assets/libs/echarts.min.js');
    code = code.replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/echarts@\d+\/dist\/echarts\.min\.js/gi, 'assets/libs/echarts.min.js');
    code = code.replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@[\d.]+\/dist\/mermaid\.min\.js/gi, 'assets/libs/mermaid.min.js');
    code = code.replace(/https?:\/\/unpkg\.com\/mermaid@[\d.]+\/dist\/mermaid\.min\.js/gi, 'assets/libs/mermaid.min.js');

    if (beforeReplace !== code) {
        console.log('✅ CDN链接已替换为本地路径');
    }

    // 模板模式下，移除echarts/mermaid的script标签（模板已预加载）
    if (useTemplateMode) {
        code = code.replace(/<script[^>]*echarts\.min\.js[^>]*><\/script>/gi, '<!-- echarts由模板预加载 -->');
        code = code.replace(/<script[^>]*mermaid\.min\.js[^>]*><\/script>/gi, '<!-- mermaid由模板预加载 -->');
    }

    return code;
}

/**
 * 传统模式更新预览 - 使用srcdoc
 */
function updatePreviewLegacy(code) {
    const iframe = document.getElementById('preview-frame');

    // 设置标志防止重复更新
    isUpdatingFromEditor = true;

    // ⚡ 性能优化：移除未使用的大型库（节省加载时间）
    console.time('⏱️ 清理未使用的库');

    // 检测是否实际使用了各个库
    const hasEChartsUsage = code.includes('echarts.init') || code.includes('echarts.graphic') ||
        code.includes('data-echarts') || code.match(/var\s+\w+\s*=\s*echarts/);
    const hasMermaidUsage = code.includes('class="mermaid"') || code.includes("class='mermaid'") ||
        code.includes('mermaid.initialize') || code.includes('mermaid.run');
    const hasDrawioUsage = code.includes('data-drawio') || code.includes('class="mxgraph"') ||
        code.includes('class="drawio');

    // 移除未使用的ECharts库（1MB）
    if (!hasEChartsUsage && code.includes('echarts.min.js')) {
        code = code.replace(/<script[^>]*echarts\.min\.js[^>]*><\/script>/gi, '');
        console.log('⚡ 性能优化: 移除未使用的ECharts库 (节省1MB, ~16秒)');
    }

    // 移除未使用的Mermaid库（3.3MB）
    if (!hasMermaidUsage && code.includes('mermaid.min.js')) {
        code = code.replace(/<script[^>]*mermaid\.min\.js[^>]*><\/script>/gi, '');
        // 移除mermaid初始化代码
        code = code.replace(/<script[^>]*>[\s\S]*?mermaid\.initialize[\s\S]*?<\/script>/gi, '');
        code = code.replace(/<script[^>]*>[\s\S]*?mermaid\.run[\s\S]*?<\/script>/gi, '');
        console.log('⚡ 性能优化: 移除未使用的Mermaid库 (节省3.3MB, ~30秒)');
    }

    // 移除未使用的Drawio库（3.5MB）
    if (!hasDrawioUsage && code.includes('drawio-viewer.min.js')) {
        code = code.replace(/<script[^>]*drawio-viewer\.min\.js[^>]*><\/script>/gi, '');
        console.log('⚡ 性能优化: 移除未使用的Drawio库 (节省3.5MB, ~35秒)');
    }

    console.timeEnd('⏱️ 清理未使用的库');

    // 注入 ECharts 辅助脚本（如果HTML中有ECharts相关内容）
    if (code.includes('echarts') || code.includes('data-echarts')) {
        const helperScript = `
<script>
// ECharts 导出辅助函数
window.extractEChartsData = function() {
    if (typeof echarts === 'undefined') {
        console.log('[ECharts辅助] echarts 未加载');
        return 0;
    }
    let count = 0;
    const containers = document.querySelectorAll('[data-echarts], [_echarts_instance_], .echarts-container');
    console.log("[ECharts辅助] 找到 " + containers.length + " 个图表容器");
    containers.forEach((container, index) => {
        const instanceId = container.getAttribute('_echarts_instance_');
        if (instanceId) {
            try {
                const instance = echarts.getInstanceById(instanceId);
                if (instance) {
                    const dataURL = instance.getDataURL({
                        type: 'png',
                        pixelRatio: 2,
                        backgroundColor: '#ffffff'
                    });
                    container.setAttribute('data-echarts-image', dataURL);
                    container.setAttribute('data-echarts-width', container.offsetWidth || 600);
                    container.setAttribute('data-echarts-height', container.offsetHeight || 400);
                    count++;
                    console.log("[ECharts辅助] ✅ 提取图表 " + (container.id || index) + ": " + dataURL.length + " bytes");
                }
            } catch (error) {
                console.warn("[ECharts辅助] ⚠️ 提取图表 " + (container.id || index) + " 失败:", error);
            }
        }
    });
    console.log("[ECharts辅助] 共提取 " + count + " 个图表数据");
    return count;
};
</script>
`;
        // 在 </body> 标签前插入辅助脚本
        if (code.includes('</body>')) {
            code = code.replace('</body>', helperScript + '</body>');
        } else {
            code += helperScript;
        }
    }

    // 注入 Mermaid 库和初始化脚本（如果HTML中有Mermaid图表）
    if (code.includes("class=\"mermaid\"") || code.includes("class='mermaid'")) {
        // 检查是否已有Mermaid库引用
        if (!code.includes("mermaid.min.js")) {
            const mermaidScript = `
<script src="assets/libs/mermaid.min.js"><\/script>
<script>
// Mermaid初始化配置
if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        logLevel: 'error'
    });

    // 页面加载完成后渲染Mermaid图表
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log("[Mermaid] 开始渲染图表");
            mermaid.run().catch(err => console.error("[Mermaid] 渲染失败:", err));
        });
    } else {
        console.log("[Mermaid] 立即渲染图表");
        setTimeout(() => {
            mermaid.run().catch(err => console.error("[Mermaid] 渲染失败:", err));
        }, 100);
    }
}
<\/script>
`;
            // 在 </head> 或 <body> 标签前插入Mermaid库脚本
            if (code.includes("</head>")) {
                code = code.replace("</head>", mermaidScript + "</head>");
            } else if (code.includes("<body>")) {
                code = code.replace("<body>", "<body>" + mermaidScript);
            } else {
                code = mermaidScript + code;
            }
        }
    }

    // 注入 Mermaid和SVG图表 辅助脚本（如果HTML中有相关内容）
    if (code.includes("class=\"mermaid\"") || code.includes("class=\"mxgraph\"") || code.includes("<svg")) {
        const diagramHelperScript = `
<script>
// Mermaid和SVG图表导出辅助函数
window.extractDiagramData = async function() {
    let count = 0;
    const promises = [];

    // 处理Mermaid图表
    const mermaidContainers = document.querySelectorAll(".mermaid svg");
    console.log("[图表辅助] 找到 " + mermaidContainers.length + " 个Mermaid图表");

    mermaidContainers.forEach((svg, index) => {
        const promise = (async () => {
            try {
                const container = svg.parentElement;
                const dataURL = await svgToDataURL(svg);
                if (dataURL) {
                    container.setAttribute("data-diagram-image", dataURL);
                    const bbox = svg.getBoundingClientRect();
                    container.setAttribute("data-diagram-width", svg.width.baseVal.value || bbox.width || 600);
                    container.setAttribute("data-diagram-height", svg.height.baseVal.value || bbox.height || 400);
                    container.setAttribute("data-diagram-type", "mermaid");
                    count++;
                    console.log("[图表辅助] ✅ 提取Mermaid图表 " + index);
                }
            } catch (error) {
                console.warn("[图表辅助] ⚠️ 提取Mermaid图表 " + index + " 失败:", error);
            }
        })();
        promises.push(promise);
    });

    // 处理Draw.io/独立SVG图表
    const svgContainers = document.querySelectorAll(".mxgraph svg, .diagram-container svg");
    console.log("[图表辅助] 找到 " + svgContainers.length + " 个SVG图表容器");

    svgContainers.forEach((svg, index) => {
        const promise = (async () => {
            try {
                if (svg.closest(".mermaid")) return;

                const container = svg.parentElement;
                const dataURL = await svgToDataURL(svg);
                if (dataURL) {
                    container.setAttribute("data-diagram-image", dataURL);
                    const bbox = svg.getBoundingClientRect();
                    container.setAttribute("data-diagram-width", svg.width.baseVal.value || bbox.width || 600);
                    container.setAttribute("data-diagram-height", svg.height.baseVal.value || bbox.height || 400);
                    container.setAttribute("data-diagram-type", "svg");
                    count++;
                    console.log("[图表辅助] ✅ 提取SVG图表 " + index);
                }
            } catch (error) {
                console.warn("[图表辅助] ⚠️ 提取SVG图表 " + index + " 失败:", error);
            }
        })();
        promises.push(promise);
    });

    await Promise.all(promises);
    console.log("[图表辅助] 共提取 " + count + " 个图表数据");
    return count;
};

function svgToDataURL(svg) {
    return new Promise((resolve, reject) => {
        try {
            const clonedSvg = svg.cloneNode(true);
            if (!clonedSvg.getAttribute("xmlns")) {
                clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }

            const bbox = svg.getBoundingClientRect();
            const width = svg.width.baseVal.value || bbox.width || 600;
            const height = svg.height.baseVal.value || bbox.height || 400;

            // 设置SVG的宽高属性
            clonedSvg.setAttribute("width", width);
            clonedSvg.setAttribute("height", height);

            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(clonedSvg);

            const canvas = document.createElement("canvas");
            canvas.width = width * 2;
            canvas.height = height * 2;
            const ctx = canvas.getContext("2d");

            const img = new Image();

            // 使用data URI替代Blob URL避免跨域问题
            const encodedSvg = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));

            img.onload = function() {
                try {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataURL = canvas.toDataURL("image/png");
                    resolve(dataURL);
                } catch (err) {
                    console.error("[SVG转换] Canvas导出失败:", err);
                    reject(err);
                }
            };

            img.onerror = function(err) {
                console.error("[SVG转换] 图片加载失败:", err);
                reject(err);
            };

            // 设置crossOrigin避免Canvas污染（虽然使用data URI通常不需要）
            img.crossOrigin = "anonymous";
            img.src = encodedSvg;
        } catch (error) {
            console.error("[SVG转换] 处理失败:", error);
            reject(error);
        }
    });
}
<\/script>
`;
        // 在 </body> 标签前插入辅助脚本
        if (code.includes("</body>")) {
            code = code.replace("</body>", diagramHelperScript + "</body>");
        } else {
            code += diagramHelperScript;
        }
    }

    // 注入脚本执行增强器，确保DOMContentLoaded和其他初始化代码能正确执行
    const initEnhancer = `
<script>
(function() {
    console.log('🚀 [iframe] 增强器开始执行');
    var startTime = performance.now();
    var originalAddEventListener = document.addEventListener;
    var domReadyCallbacks = [];
    var executed = false;

    // 监控script标签加载
    var scriptLoadTimes = {};
    var originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        var element = originalCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'script' && element.src) {
            var scriptSrc = element.src;
            var scriptStart = performance.now();
            element.addEventListener('load', function() {
                var loadTime = performance.now() - scriptStart;
                scriptLoadTimes[scriptSrc] = loadTime;
                console.log('📜 [iframe] 脚本加载:', scriptSrc.split('/').pop(), '-', loadTime.toFixed(2), 'ms');
            });
            element.addEventListener('error', function() {
                console.error('❌ [iframe] 脚本加载失败:', scriptSrc);
            });
        }
        return element;
    };

    // 执行所有回调的函数
    function executeCallbacks() {
        if (executed) return;
        executed = true;
        var execTime = performance.now() - startTime;
        console.log('✅ [iframe] 执行', domReadyCallbacks.length, '个回调, 从增强器启动到现在:', execTime.toFixed(2), 'ms');
        domReadyCallbacks.forEach(function(cb) {
            try { cb(); } catch (e) { console.error('[iframe] 回调失败:', e); }
        });
    }

    // 重写addEventListener以捕获DOMContentLoaded监听器
    document.addEventListener = function(event, handler, options) {
        if (event === 'DOMContentLoaded') {
            domReadyCallbacks.push(handler);
            console.log('📌 [iframe] 捕获DOMContentLoaded监听器');
            // 如果DOM已ready，立即执行
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(function() { try { handler(); } catch (e) {} }, 0);
            }
        } else {
            originalAddEventListener.call(document, event, handler, options);
        }
    };

    // 监听readystatechange事件（最可靠）
    originalAddEventListener.call(document, 'readystatechange', function() {
        console.log('📊 [iframe] readyState:', document.readyState);
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            executeCallbacks();
        }
    });

    // 监听DOMContentLoaded事件
    originalAddEventListener.call(document, 'DOMContentLoaded', function() {
        console.log('🎯 [iframe] DOMContentLoaded触发');
        executeCallbacks();
    });

    // 监听load事件（兜底）
    originalAddEventListener.call(window, 'load', function() {
        var totalTime = performance.now() - startTime;
        console.log('🏁 [iframe] window.load触发, 总耗时:', totalTime.toFixed(2), 'ms');
        executeCallbacks();
    });

    // 定时器兜底：50ms后检查
    setTimeout(function() {
        if (document.readyState !== 'loading') executeCallbacks();
    }, 50);
})();
<\/script>
`;

    console.time('⏱️ 注入增强脚本');
    // 在<head>标签后插入增强脚本
    if (code.includes('<head>')) {
        code = code.replace('<head>', '<head>' + initEnhancer);
    } else if (code.includes('<!DOCTYPE')) {
        code = code.replace('<!DOCTYPE html>', '<!DOCTYPE html>' + initEnhancer);
    } else {
        code = initEnhancer + code;
    }
    console.timeEnd('⏱️ 注入增强脚本');

    console.log('📊 最终HTML大小:', (code.length / 1024).toFixed(2), 'KB');

    // Use srcdoc for smoother updates that preserve script state
    console.time('⏱️ 设置iframe.srcdoc');
    iframe.srcdoc = code;
    console.timeEnd('⏱️ 设置iframe.srcdoc');

    // 监控iframe内部的资源加载
    console.log('⏳ 等待iframe加载...');
    const iframeLoadStart = performance.now();

    // Wait for iframe to load before enabling edit mode
    iframe.onload = function () {
        const iframeLoadTime = performance.now() - iframeLoadStart;
        console.log('✅ iframe onload触发, 耗时:', iframeLoadTime.toFixed(2), 'ms');
        console.timeEnd('⏱️ updatePreview总耗时');

        // 检查iframe内部的资源加载情况
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeWindow = iframe.contentWindow;

            if (iframeWindow && iframeWindow.performance) {
                const resources = iframeWindow.performance.getEntriesByType('resource');
                console.log('📦 iframe内加载的资源数量:', resources.length);

                // 找出加载最慢的前5个资源
                const slowResources = resources
                    .map(r => ({
                        name: r.name.split('/').pop(),
                        url: r.name,
                        duration: r.duration,
                        size: r.transferSize
                    }))
                    .sort((a, b) => b.duration - a.duration)
                    .slice(0, 5);

                if (slowResources.length > 0) {
                    console.log('🐌 加载最慢的资源:');
                    slowResources.forEach((r, i) => {
                        console.log(`  ${i + 1}. ${r.name} - ${r.duration.toFixed(2)}ms (${(r.size / 1024).toFixed(2)}KB)`);
                        if (r.duration > 1000) {
                            console.warn(`     ⚠️ 此资源加载超过1秒: ${r.url}`);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('无法获取iframe资源信息:', e);
        }

        if (isEditMode) {
            setTimeout(() => enableEditableMode(), 100);
        }

        // 处理iframe内的锚点链接，防止重新加载页面
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
                // 拦截所有链接点击
                iframeDoc.addEventListener('click', function (e) {
                    const target = e.target.closest('a');
                    if (target && target.href) {
                        const href = target.getAttribute('href');
                        // 如果是锚点链接（以#开头）
                        if (href && href.startsWith('#')) {
                            e.preventDefault();
                            // 在iframe内部进行滚动
                            const targetId = href.substring(1);
                            const targetElement = iframeDoc.getElementById(targetId);
                            if (targetElement) {
                                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }
                        // 如果是外部链接，在新标签页打开
                        else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                            e.preventDefault();
                            window.open(href, '_blank');
                        }
                    }
                }, true);
            }
        } catch (err) {
            console.warn('无法访问iframe内容:', err);
        }

        updateStatus('预览已更新');
        console.timeEnd('⏱️ updatePreview总耗时');
    };

    setTimeout(() => { isUpdatingFromEditor = false; }, 600);
}

/**
 * 切换预览模式（用于调试或fallback）
 * @param {boolean} useTemplate - 是否使用模板模式
 */
function setPreviewMode(useTemplate) {
    useTemplateMode = useTemplate;
    console.log(`[预览模式] 切换到${useTemplate ? '模板' : '传统'}模式`);

    if (useTemplate && !previewTemplateReady) {
        // 重新初始化模板
        initPreviewTemplate();
    } else if (!useTemplate) {
        // 切换到传统模式，需要完整刷新
        const iframe = document.getElementById('preview-frame');
        iframe.src = 'about:blank';
        previewTemplateReady = false;
        setTimeout(() => updatePreview(), 100);
    }
}

// 暴露给控制台调试
window.setPreviewMode = setPreviewMode;
window.getPreviewMode = () => ({ useTemplateMode, previewTemplateReady });

function toggleCodeEditor() {
    isEditorVisible = !isEditorVisible;
    const leftPanel = document.querySelector('.left-panel');
    const middlePanel = document.querySelector('.middle-panel');
    const rightPanel = document.querySelector('.right-panel');
    const btn = document.getElementById('toggle-editor-btn');
    if (isEditorVisible) {
        leftPanel.classList.remove('hidden');
        middlePanel.classList.remove('expanded');
        rightPanel.classList.remove('expanded');
        btn.innerHTML = getIcon('arrowLeft') + ' 隐藏编辑器';
        updateStatus('代码编辑器已显示');
    } else {
        leftPanel.classList.add('hidden');
        middlePanel.classList.add('expanded');
        rightPanel.classList.add('expanded');
        btn.innerHTML = getIcon('play') + ' 显示编辑器';
        updateStatus('代码编辑器已隐藏');
    }
}
function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('toggle-edit-btn');
    const badge = document.getElementById('edit-mode-badge');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (isEditMode) {
        btn.innerHTML = getIcon('lock') + ' 禁用编辑';
        btn.classList.add('active');
        badge.style.display = 'block';
        undoBtn.style.display = 'inline-block';
        redoBtn.style.display = 'inline-block';

        // 启用编辑模式时，保存初始状态到历史记录
        savePreviewHistory();
        updateUndoRedoButtons();

        enableEditableMode();
        updateStatus('编辑模式已启用 - 可直接编辑预览内容');
    } else {
        btn.innerHTML = getIcon('edit') + ' 启用编辑';
        btn.classList.remove('active');
        badge.style.display = 'none';
        undoBtn.style.display = 'none';
        redoBtn.style.display = 'none';

        // 清空历史记录
        previewHistory = [];
        previewHistoryIndex = -1;

        disableEditableMode();
        updateStatus('编辑模式已禁用');
    }
}

function enableEditableMode() {
    console.log('[EDIT MODE] Enabling editable mode');
    const iframe = document.getElementById('preview-frame');

    // 模板模式：通过postMessage启用编辑
    if (useTemplateMode && previewTemplateReady) {
        iframe.contentWindow.postMessage({ type: 'enable-edit', enabled: true }, '*');
        return;
    }

    // 传统模式：直接操作DOM
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        // 使所有文本元素可编辑
        const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span, li, td, th, a, button, label');
        textElements.forEach(el => {
            el.setAttribute('contenteditable', 'true');
            // 监听内容变化
            el.addEventListener('input', function () {
                console.log('[SYNC] Input event triggered on element:', el.tagName);
                clearTimeout(syncTimeout);
                syncTimeout = setTimeout(() => {
                    syncPreviewToCode();
                }, 1000);
            });
            el.addEventListener('blur', function () {
                syncPreviewToCode();
            });
        });
    } catch (err) {
        console.warn('[EDIT MODE] 无法启用编辑模式:', err);
    }
}

function disableEditableMode() {
    const iframe = document.getElementById('preview-frame');

    // 模板模式：通过postMessage禁用编辑
    if (useTemplateMode && previewTemplateReady) {
        iframe.contentWindow.postMessage({ type: 'enable-edit', enabled: false }, '*');
        return;
    }

    // 传统模式：直接操作DOM
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // 1. 移除 contenteditable 属性
        const editableElements = iframeDoc.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => {
            el.removeAttribute('contenteditable');
        });

        // 2. 清理选中效果相关的类名
        const elementsWithHover = iframeDoc.querySelectorAll('.preview-element-hover');
        elementsWithHover.forEach(el => {
            el.classList.remove('preview-element-hover');
        });

        const elementsWithSelection = iframeDoc.querySelectorAll('.preview-selection-highlight');
        elementsWithSelection.forEach(el => {
            el.classList.remove('preview-selection-highlight');
        });

        // 3. 移除注入的选中效果样式
        const injectedStyle = iframeDoc.getElementById('selection-styles-injected');
        if (injectedStyle) {
            injectedStyle.remove();
            console.log('✅ [EDIT MODE] 已清理选中效果样式');
        }

        console.log('✅ [EDIT MODE] 编辑模式已禁用，辅助样式已清理');
    } catch (err) {
        console.warn('[EDIT MODE] 无法禁用编辑模式:', err);
    }
}

function syncPreviewToCode() {
    console.log('[SYNC] syncPreviewToCode called, isUpdatingFromEditor:', isUpdatingFromEditor);
    if (isUpdatingFromEditor) return;
    isUpdatingFromPreview = true;
    const iframe = document.getElementById('preview-frame');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // 在同步前，先清理所有可视化编辑辅助元素
    try {
        // 1. 移除注入的选中效果样式
        const injectedStyle = iframeDoc.getElementById('selection-styles-injected');
        if (injectedStyle) {
            injectedStyle.remove();
        }

        // 2. 清理所有辅助类名
        const elementsWithHover = iframeDoc.querySelectorAll('.preview-element-hover');
        elementsWithHover.forEach(el => {
            el.classList.remove('preview-element-hover');
        });

        const elementsWithSelection = iframeDoc.querySelectorAll('.preview-selection-highlight');
        elementsWithSelection.forEach(el => {
            el.classList.remove('preview-selection-highlight');
        });

        console.log('✅ [SYNC] 已清理可视化编辑辅助元素');
    } catch (err) {
        console.warn('[SYNC] 清理辅助元素失败:', err);
    }

    // 获取完整的HTML（包括修改）
    let html = '<!DOCTYPE html>\n';
    html += iframeDoc.documentElement.outerHTML;

    // 清理编辑相关属性
    html = html.replace(/\s*contenteditable="true"/gi, '');

    // 清理可视化编辑辅助类名（正则清理，确保彻底删除）
    html = html.replace(/\s*class="preview-element-hover"/gi, '');
    html = html.replace(/\s*class="preview-selection-highlight"/gi, '');
    html = html.replace(/\s*preview-element-hover\s*/gi, '');
    html = html.replace(/\s*preview-selection-highlight\s*/gi, '');

    // 清理注入的选中效果样式标签（如果DOM清理失败，通过正则兜底）
    html = html.replace(/<style\s+id="selection-styles-injected">[\s\S]*?<\/style>/gi, '');

    // 更新编辑器
    const currentPosition = editor.getPosition();
    editor.setValue(html);
    // 尝试恢复光标位置
    try {
        editor.setPosition(currentPosition);
    } catch (e) { }

    // 如果是编辑模式，保存历史记录
    if (isEditMode) {
        savePreviewHistory();
        updateUndoRedoButtons();
    }

    updateStatus('预览修改已同步到代码（已清理辅助样式）');

    // 处理预览同步后的内容变化，启用保存按钮
    handleEditorContentChange();

    setTimeout(() => { isUpdatingFromPreview = false; }, 600);
}

// 保存预览历史记录
function savePreviewHistory() {
    const currentCode = editor.getValue();

    // 避免重复保存相同内容
    if (previewHistory.length > 0 && previewHistory[previewHistoryIndex] === currentCode) {
        return;
    }

    // 如果当前不在历史记录末尾，删除后面的记录
    if (previewHistoryIndex < previewHistory.length - 1) {
        previewHistory = previewHistory.slice(0, previewHistoryIndex + 1);
    }

    // 添加新记录
    previewHistory.push(currentCode);

    // 限制历史记录数量为5步
    if (previewHistory.length > MAX_HISTORY_STEPS) {
        previewHistory.shift();
        previewHistoryIndex = MAX_HISTORY_STEPS - 1;
    } else {
        previewHistoryIndex = previewHistory.length - 1;
    }

    console.log('[历史记录] 已保存，当前索引:', previewHistoryIndex, '总数:', previewHistory.length);
}

// 撤销预览编辑
function undoPreviewEdit() {
    if (previewHistoryIndex <= 0) {
        updateStatus('⚠️ 无法撤销，已到达最早的记录');
        return;
    }

    previewHistoryIndex--;
    const previousCode = previewHistory[previewHistoryIndex];

    // 临时禁用保存历史记录
    isUpdatingFromEditor = true;
    editor.setValue(previousCode);
    updatePreview();

    setTimeout(() => {
        isUpdatingFromEditor = false;
        updateUndoRedoButtons();
        updateStatus(`↶ 已撤销 (剩余 ${previewHistoryIndex} 步可撤销)`);
    }, 100);

    console.log('[撤销] 当前索引:', previewHistoryIndex);
}

// 重做预览编辑
function redoPreviewEdit() {
    if (previewHistoryIndex >= previewHistory.length - 1) {
        updateStatus('⚠️ 无法重做，已到达最新的记录');
        return;
    }

    previewHistoryIndex++;
    const nextCode = previewHistory[previewHistoryIndex];

    // 临时禁用保存历史记录
    isUpdatingFromEditor = true;
    editor.setValue(nextCode);
    updatePreview();

    setTimeout(() => {
        isUpdatingFromEditor = false;
        updateUndoRedoButtons();
        updateStatus(`↷ 已重做 (剩余 ${previewHistory.length - 1 - previewHistoryIndex} 步可重做)`);
    }, 100);

    console.log('[重做] 当前索引:', previewHistoryIndex);
}

// 更新撤销/重做按钮状态
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (!undoBtn || !redoBtn) return;

    // 更新撤销按钮
    if (previewHistoryIndex > 0) {
        undoBtn.disabled = false;
        undoBtn.style.opacity = '1';
        undoBtn.style.cursor = 'pointer';
    } else {
        undoBtn.disabled = true;
        undoBtn.style.opacity = '0.5';
        undoBtn.style.cursor = 'not-allowed';
    }

    // 更新重做按钮
    if (previewHistoryIndex < previewHistory.length - 1) {
        redoBtn.disabled = false;
        redoBtn.style.opacity = '1';
        redoBtn.style.cursor = 'pointer';
    } else {
        redoBtn.disabled = true;
        redoBtn.style.opacity = '0.5';
        redoBtn.style.cursor = 'not-allowed';
    }
}

function runCode() { updatePreview(); updateStatus('代码已运行'); }
async function clearCode() {
    if (confirm('确定要清空代码吗？')) {
        await loadDefaultCode();
        editor.setValue(defaultCode);
        updatePreview();
        updateStatus('已重置为默认代码');

        // 清空代码后，清除当前编辑的代码块ID
        currentEditingBlockId = null;
        lastSavedContent = '';

        // 隐藏版本标签
        const versionTagsContainer = document.getElementById('version-tags-container');
        if (versionTagsContainer) {
            versionTagsContainer.style.display = 'none';
            versionTagsContainer.innerHTML = '';
        }

        // 禁用保存按钮
        setSaveButtonEnabled(false);
    }
}
async function saveCode() {
    // 检查保存按钮是否被禁用
    const saveBtn = document.getElementById('save-code-btn');
    if (saveBtn && saveBtn.disabled) {
        showVersionNotification('请先应用AI代码块后再保存', 'info');
        return;
    }

    const code = editor.getValue();

    // 版本管理：如果当前正在编辑某个代码块，保存为新版本
    if (versionManager && currentEditingBlockId) {
        // 确保版本管理器中有这个代码块的数据
        if (!versionManager.versions[currentEditingBlockId]) {
            versionManager.versions[currentEditingBlockId] = {
                versions: [],
                currentVersion: 0
            };
        }

        const currentVersion = versionManager.getCurrentVersion(currentEditingBlockId);
        const currentContent = currentVersion > 0 ? versionManager.getVersionContent(currentEditingBlockId, currentVersion) : null;

        // 比较内容是否有变化（使用 lastSavedContent 作为基准）
        const normalizedSaved = versionManager.normalizeContent(lastSavedContent);
        const normalizedNew = versionManager.normalizeContent(code);

        if (normalizedSaved && normalizedSaved === normalizedNew) {
            showVersionNotification('内容无变化，无需保存新版本');
            return;
        }

        console.log('[版本管理] 内容比较:', {
            savedLength: lastSavedContent.length,
            newLength: code.length,
            normalizedSavedLength: normalizedSaved ? normalizedSaved.length : 0,
            normalizedNewLength: normalizedNew.length,
            isEqual: normalizedSaved === normalizedNew
        });

        // 显示保存中状态
        showVersionNotification('正在保存...', 'loading');

        // 判断是否为第一次保存（currentVersion === 0 表示还没有保存过）
        const isFirstSave = currentVersion === 0;

        // 创建新版本（异步）
        // 第一次保存时 isOriginal = true（作为原始版本 v1）
        const newVersion = await versionManager.createVersion(currentEditingBlockId, code, isFirstSave);

        if (newVersion) {
            // 更新上次保存的内容
            lastSavedContent = code;

            renderVersionTags(currentEditingBlockId);
            showVersionNotification(`已保存为 v${newVersion}`);
            console.log(`[版本管理] 已保存新版本 v${newVersion}`);
        } else {
            showVersionNotification('保存失败，请稍后重试', 'error');
        }
    } else {
        // 原有的保存逻辑（导出文件）
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
        URL.revokeObjectURL(url);
        updateStatus('代码已保存');
    }
}
function updateStatusBar() {
    const position = editor.getPosition();
    const model = editor.getModel();
    const lineCount = model.getLineCount();
}
function updateStatus(message) {
    const statusEl = document.getElementById('status-text');
    if (statusEl) {
        statusEl.textContent = message;
    }
    // Also log to console for debugging
    console.log('[STATUS]', message);
}
function formatMessageContent(t, isStreaming = false, messageTimestamp = null) {
    if (!t) return '';
    const r = /```([\w]*)\n/g;
    const e = /```/g;
    const blocks = [];
    let match;
    e.lastIndex = 0;

    // 使用传入的时间戳或当前时间戳
    const timestamp = messageTimestamp || Date.now();

    while ((match = r.exec(t)) !== null) {
        blocks.push({ start: match.index, startEnd: r.lastIndex, lang: match[1] || 'code' })
    }
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        e.lastIndex = b.startEnd;
        const endMatch = e.exec(t);
        if (endMatch) {
            b.end = endMatch.index;
            b.endEnd = e.lastIndex;
            b.code = t.substring(b.startEnd, b.end)
        } else {
            // 如果没找到结束标记，查找下一个代码块的开始位置
            const nextBlock = blocks[i + 1];
            if (nextBlock) {
                // 代码块到下一个代码块开始之前
                b.end = nextBlock.start;
                b.endEnd = nextBlock.start;
                b.code = t.substring(b.startEnd, b.end);
            } else {
                // 代码块到文本末尾
                b.code = t.substring(b.startEnd);
                b.endEnd = t.length;
            }
            b.incomplete = true
        }
    }
    let o = '', pos = 0;
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const b = blocks[blockIndex];

        // 生成代码块唯一ID
        const blockId = `codeblock_${timestamp}_${blockIndex}`;

        if (pos < b.start) {
            o += escapeHtml(t.substring(pos, b.start)).replace(/\n/g, '<br>')
        }
        if (!showCodeBlocks) {
            // ⭐ 使用函数参数而不是全局变量，确保流式输出效果
            const placeholder = isStreaming ? '生成中...' : '←内容已完成';
            const encodedCode = escapeHtml(b.code).replace(/'/g, '&apos;').replace(/"/g, '&quot;');
            o += `<div class="code-block-placeholder" style="padding:10px;background:#2d2d30;border-radius:4px;color:#888;font-style:italic;" data-code="${encodedCode}" data-block-id="${blockId}">${placeholder}</div>`
        } else {
            o += `<div class="code-block-container" data-block-id="${blockId}"><div class="code-block-header"><span class="code-block-lang">${b.lang}</span>`;
            if (!b.incomplete) {
                o += `<div class="code-block-actions"><button class="code-block-btn" onclick="copyCodeBlock(this)">${getIcon('clipboard')} 复制</button><button class="code-block-btn" onclick="insertCodeBlock(this)">${getIcon('plus')} 插入编辑器</button></div>`
            }
            o += `</div><pre class="code-content"><code>${escapeHtml(b.code)}</code></pre></div>`
        }
        pos = b.endEnd || b.end || t.length
    }
    if (pos < t.length) {
        o += escapeHtml(t.substring(pos)).replace(/\n/g, '<br>')
    }
    return o
}
function escapeHtml(t) { const e = document.createElement('div'); e.textContent = t; return e.innerHTML }
function copyCodeBlock(b) { const c = b.closest('.code-block-container').querySelector('code'); navigator.clipboard.writeText(c.textContent).then(() => { const o = b.innerHTML; b.innerHTML = getIcon('check') + ' 已复制'; b.style.background = '#4CAF50'; setTimeout(() => { b.innerHTML = o; b.style.background = '' }, 2000) }).catch(e => updateStatus('复制失败')) }
function insertCodeBlock(b) { if (!editor) { alert('编辑器尚未加载，请稍候再试'); return; } const c = b.closest('.code-block-container').querySelector('code').textContent, p = editor.getPosition(), e = editor.getValue(); if (!e.trim()) { editor.setValue(c) } else if (p) { const l = p.lineNumber, col = p.column; editor.executeEdits('insert', [{ range: new monaco.Range(l, col, l, col), text: '\n' + c + '\n' }]); editor.setPosition({ lineNumber: l + c.split('\n').length, column: 1 }) } else { const l = editor.getModel().getLineCount(), m = editor.getModel().getLineMaxColumn(l); editor.executeEdits('insert', [{ range: new monaco.Range(l, m, l, m), text: '\n\n' + c }]) } updatePreview(); editor.revealLine(editor.getPosition().lineNumber); b.innerHTML = getIcon('check') + ' 已插入'; b.style.background = '#4CAF50'; setTimeout(() => { b.innerHTML = getIcon('plus') + ' 插入编辑器'; b.style.background = '' }, 2000) }

// 从消息框插入代码到编辑器
async function insertCodeFromMessage(button) {
    console.time('⏱️ 应用代码总耗时');

    if (!editor) {
        alert('编辑器尚未加载，请稍候再试');
        return;
    }

    console.time('⏱️ 解析代码');
    // 从包装器中查找消息框和占位符
    const wrapper = button.closest('.ai-message-wrapper');
    const messageDiv = wrapper.querySelector('.chat-message');
    const placeholders = messageDiv.querySelectorAll('.code-block-placeholder[data-code]');

    if (placeholders.length === 0) {
        alert('没有找到代码内容');
        return;
    }

    // 收集所有HTML代码块
    let allCode = [];
    let selectedBlockId = null;
    placeholders.forEach(placeholder => {
        const encodedCode = placeholder.getAttribute('data-code');
        const blockId = placeholder.getAttribute('data-block-id');

        if (encodedCode) {
            // 使用更可靠的HTML解码方法
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<textarea>${encodedCode}</textarea>`, 'text/html');
            const code = doc.querySelector('textarea').textContent.trim();

            // 只插入HTML代码（包含<!DOCTYPE或<html标签的）
            if (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<HTML')) {
                allCode.push({ code, blockId });
            }
        }
    });

    if (allCode.length === 0) {
        alert('没有找到HTML代码内容');
        return;
    }

    // 使用最后一个HTML代码块（通常是最完整的）
    const selectedCode = allCode[allCode.length - 1];
    const code = selectedCode.code;
    selectedBlockId = selectedCode.blockId;

    console.timeEnd('⏱️ 解析代码');

    // 调试信息：显示代码长度
    console.log('📊 代码长度:', code.length, '字符', (code.length / 1024).toFixed(2), 'KB');
    console.log('📄 代码行数:', code.split('\n').length, '行');
    console.log('🆔 代码块ID:', selectedBlockId);

    // 设置当前编辑的代码块ID
    currentEditingBlockId = selectedBlockId;

    // 版本管理：创建v1版本（如果还没有）或加载已有版本
    if (versionManager && selectedBlockId) {
        if (!versionManager.hasVersions(selectedBlockId)) {
            // 创建v1版本（异步，需要等待）
            try {
                const version = await versionManager.createVersion(selectedBlockId, code, true);
                if (version) {
                    console.log('[版本管理] 已创建原始版本 v' + version);
                    // 渲染版本标签
                    renderVersionTags(selectedBlockId);
                    // 启用保存按钮
                    setSaveButtonEnabled(true);
                }
            } catch (error) {
                console.error('[版本管理] 创建原始版本失败:', error);
            }
        } else {
            // 版本已存在，直接显示版本标签
            console.log('[版本管理] 版本已存在，显示版本标签');
            renderVersionTags(selectedBlockId);
            // 启用保存按钮
            setSaveButtonEnabled(true);
        }
    }

    // 直接替换编辑器内容
    // 设置标志防止 onDidChangeModelContent 触发重复更新
    isUpdatingFromEditor = true;

    console.time('⏱️ 编辑器setValue');
    editor.setValue(code);
    console.timeEnd('⏱️ 编辑器setValue');

    console.time('⏱️ 更新预览');
    updatePreview();
    console.timeEnd('⏱️ 更新预览');

    // 延迟重置标志，确保 change 事件已处理完毕
    setTimeout(() => { isUpdatingFromEditor = false; }, 100);

    editor.revealLine(1);

    // 显示反馈
    const originalText = button.textContent;
    button.innerHTML = getIcon('check') + ' 已应用';
    button.style.color = '#4CAF50';
    setTimeout(() => {
        button.textContent = originalText;
        button.style.color = '#0e639c';
    }, 2000);

    console.timeEnd('⏱️ 应用代码总耗时');
}


// 保存对话记录到数据库
async function saveConversationToDatabase(sessionId, userMessage, aiMessage, usage = {}) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const htmlContent = editor ? editor.getValue() : '';
        const { response, data } = await apiRequest(`${API_BASE_URL}/conversations/save`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                session_id: sessionId,
                user_message: userMessage,
                ai_message: aiMessage,
                input_tokens: usage.prompt_tokens || usage.input_tokens || 0,
                output_tokens: usage.completion_tokens || usage.output_tokens || 0,
                model: usage.model || 'unknown',
                html_content: htmlContent
            })
        });

        if (data.success) {
            console.log('✅ 对话记录已保存，Token消耗:', data.data.tokens);
        } else {
            console.warn('⚠️ 保存对话记录失败:', data.message);
        }
    } catch (error) {
        if (error.message !== '认证失败') {
            console.error('保存对话记录错误:', error);
        }
    }
}

async function sendMessage() {
    // 再次检查登录状态（双重保险）
    if (!currentUser) {
        alert('请先登录后再使用 AI 对话助手功能');
        window.location.href = './login.html';
        return;
    }

    abortController = new AbortController();
    isGeneratingCode = true;
    updateSendButton();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    showTypingIndicator();

    try {
        const isOpenAI = AI_API_TYPE === 'openai';
        const fetchUrl = isOpenAI ? OPENAI_API_URL : `${DIFY_API_URL}/chat-messages`;
        const fetchOptions = isOpenAI
            ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiUrl: OPENAI_API_URL.replace('/api/chat', ''),
                    apiType: 'openai',
                    apiKey: OPENAI_API_KEY,
                    model: OPENAI_MODEL,
                    messages: [{ role: 'user', content: message }],
                    temperature: 0.7,
                    stream: true
                }),
                signal: abortController.signal
            }
            : {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: {},
                    query: message,
                    response_mode: 'streaming',
                    conversation_id: conversationId,
                    user: 'visual-editor-user'
                }),
                signal: abortController.signal
            };

        const response = await fetch(fetchUrl, fetchOptions);

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.statusText}`);
        }

        // ⭐ 不在这里隐藏等待指示器，而是在收到第一条数据创建消息元素时隐藏，避免空白期

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        let messageElement = null;
        let buffer = ''; // 缓冲区用于处理不完整的数据

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 按行分割，保留最后一个可能不完整的行
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && trimmedLine.startsWith('data: ')) {
                    try {
                        const jsonStr = trimmedLine.slice(6);
                        if (!jsonStr || jsonStr === '[DONE]') continue;
                        const data = JSON.parse(jsonStr);

                        if (isOpenAI) {
                            const content = data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content;
                            if (content) {
                                aiResponse += content;

                                if (!messageElement) {
                                    hideTypingIndicator();
                                    const messageTimestamp = Date.now();
                                    addMessage('', 'ai', messageTimestamp);
                                    const messages = document.querySelectorAll('.message-content');
                                    messageElement = messages[messages.length - 1];
                                    messageElement.setAttribute("data-is-generating", "true");
                                    messageElement.dataset.messageTimestamp = messageTimestamp;
                                    isGeneratingCode = true;
                                }

                                const messageTimestamp = parseInt(messageElement.dataset.messageTimestamp);
                                messageElement.setAttribute('data-original-content', aiResponse);
                                messageElement.innerHTML = formatMessageContent(aiResponse, true, messageTimestamp);
                            }
                        } else {
                            if (data.event === 'message' || data.event === 'agent_message') {
                                aiResponse += data.answer;

                                if (!messageElement) {
                                    hideTypingIndicator();
                                    const messageTimestamp = Date.now();
                                    addMessage('', 'ai', messageTimestamp);
                                    const messages = document.querySelectorAll('.message-content');
                                    messageElement = messages[messages.length - 1];
                                    messageElement.setAttribute("data-is-generating", "true");
                                    messageElement.dataset.messageTimestamp = messageTimestamp;
                                    isGeneratingCode = true;
                                }

                                const messageTimestamp = parseInt(messageElement.dataset.messageTimestamp);
                                messageElement.setAttribute('data-original-content', aiResponse);
                                messageElement.innerHTML = formatMessageContent(aiResponse, true, messageTimestamp);
                            } else if (data.event === 'message_end') {
                                conversationId = data.conversation_id || conversationId;

                                if (conversationId) {
                                    localStorage.setItem('current_conversation_id', conversationId);

                                    if (versionManager && versionManager.currentConversationId !== conversationId) {
                                        versionManager.switchConversation(conversationId).then(() => {
                                            console.log('[版本管理] 已切换到会话:', conversationId);
                                        });
                                    }
                                }

                                isGeneratingCode = false;
                                updateSendButton();
                                if (messageElement) {
                                    const messageTimestamp = parseInt(messageElement.dataset.messageTimestamp);
                                    messageElement.setAttribute("data-is-generating", "false");
                                    messageElement.innerHTML = formatMessageContent(aiResponse, false, messageTimestamp);

                                    const hasCodeBlock = messageElement.querySelector('.code-block-placeholder[data-code]');
                                    if (hasCodeBlock) {
                                        const wrapper = messageElement.closest('.ai-message-wrapper');
                                        if (wrapper && !wrapper.querySelector('.insert-code-btn-bottom')) {
                                            const insertBtn = document.createElement('button');
                                            insertBtn.className = 'insert-code-btn-bottom';
                                            insertBtn.textContent = '应用';
                                            insertBtn.onclick = function () { insertCodeFromMessage(this); };
                                            wrapper.appendChild(insertBtn);
                                        }
                                    }
                                }

                                if (currentUser && conversationId && message && aiResponse) {
                                    saveConversationToDatabase(
                                        conversationId,
                                        message,
                                        aiResponse,
                                        data.metadata?.usage || {}
                                    );
                                }

                                if (autoInsertCode && aiResponse.trim()) {
                                    setTimeout(() => {
                                        autoInsertToEditor(aiResponse);
                                    }, 500);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('解析错误:', e);
                    }
                }
            }
        }

    } catch (error) {
        hideTypingIndicator();
        addMessage(`发送失败: ${error.message}`, 'ai');
    }
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'chat-message';
    indicator.innerHTML = `
                <div class="message-avatar ai-avatar">AI</div>
                <div class="message-content typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}
function addMessage(content, type, messageTimestamp = null) {
    const messagesContainer = document.getElementById('chat-messages');

    // 生成或使用传入的时间戳
    const timestamp = messageTimestamp || Date.now();

    if (type === 'ai') {
        // AI消息使用包装器，包含消息和按钮
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message-wrapper';
        wrapper.dataset.timestamp = timestamp; // 添加时间戳

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai-message';
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar ai-avatar';
        avatarDiv.textContent = 'AI';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content;
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        wrapper.appendChild(messageDiv);

        // 检查是否包含代码块，只有包含代码块才显示按钮
        const hasCodeBlock = contentDiv.querySelector('.code-block-placeholder[data-code]');
        if (hasCodeBlock) {
            const insertBtn = document.createElement('button');
            insertBtn.className = 'insert-code-btn-bottom';
            insertBtn.textContent = '应用';
            insertBtn.onclick = function () { insertCodeFromMessage(this); };
            wrapper.appendChild(insertBtn);
        }

        messagesContainer.appendChild(wrapper);
    } else {
        // 用户消息保持原样
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar user-avatar';
        avatarDiv.textContent = 'U';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content;
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
function generateAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('编辑') || lowerMessage.includes('修改')) {
        return '你可以点击顶部的"启用编辑"按钮，然后直接在预览区域编辑文本。修改会自动同步到代码编辑器！';
    } else if (lowerMessage.includes('同步')) {
        return '双向同步功能已启用！你可以：<br>1. 在代码编辑器中修改代码，预览会自动更新<br>2. 启用编辑后，直接在预览区编辑，代码会自动同步';
    } else if (lowerMessage.includes('代码')) {
        const code = editor.getValue();
        return `我看到你的代码了！当前代码有 ${code.split('\n').length} 行。${isEditMode ? '编辑模式已启用。' : '你可以启用编辑模式来直接修改预览内容。'}`;
    } else if (lowerMessage.includes('颜色') || lowerMessage.includes('背景')) {
        return '你可以在CSS中修改 <code>background</code> 属性来改变背景颜色。或者直接启用编辑，然后修改页面内容！';
    } else {
        return '我理解了。试试启用编辑功能，你可以直接在预览区域修改内容，修改会自动同步到代码！';
    }
}
document.getElementById('chat-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // 使用 handleSendClick 统一处理登录检查
        handleSendClick();
    }
});
document.getElementById('chat-input').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
// 优化的拖动实现 - 使用RAF防止卡顿
const resizer = document.getElementById('resizer');
const middlePanel = document.querySelector('.middle-panel');
const rightPanel = document.querySelector('.right-panel');
const contentPanel = document.querySelector('.content');
let isResizing = false;
let currentX = 0;
let containerRect = null;
let animationFrameId = null;

if (resizer) {
    resizer.addEventListener('mousedown', function (e) {
        isResizing = true;
        currentX = e.clientX;
        containerRect = contentPanel.getBoundingClientRect();
        resizer.classList.add('resizing');
        contentPanel.classList.add('resizing-panels');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isResizing) return;
        currentX = e.clientX;

        // 使用RAF批处理更新，避免频繁重绘
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updatePanelWidths);
        }
        e.preventDefault();
    });

    function updatePanelWidths() {
        if (!isResizing || !containerRect) return;

        const mouseX = currentX - containerRect.left;
        let middlePercent = (mouseX / containerRect.width) * 100;

        // 限制范围：20% - 80%
        middlePercent = Math.max(20, Math.min(80, middlePercent));
        const rightPercent = 100 - middlePercent;

        middlePanel.style.width = middlePercent + '%';
        rightPanel.style.width = rightPercent + '%';

        animationFrameId = null;
    }

    document.addEventListener('mouseup', function () {
        if (isResizing) {
            isResizing = false;
            containerRect = null;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            contentPanel.classList.remove('resizing-panels');
            document.body.style.userSelect = '';
        }
    });
}

// ========== 预览区选中内容功能 ==========
let selectedRange = null;
let selectedElement = null;
let selectionText = '';

// 注入元素选择样式到iframe
function injectSelectionStylesToIframe(iframeDoc) {
    // 检查是否已经注入
    if (iframeDoc.getElementById('selection-styles-injected')) {
        return;
    }

    const style = iframeDoc.createElement('style');
    style.id = 'selection-styles-injected';
    style.textContent = `
                /* 元素悬停高亮 */
                .preview-element-hover {
                    outline: 2px solid rgba(101, 175, 255, 0.8) !important;
                    outline-offset: 0px !important;
                    background: rgba(101, 175, 255, 0.1) !important;
                    cursor: pointer !important;
                    transition: all 0.15s ease !important;
                }

                /* 元素选中高亮 */
                .preview-selection-highlight {
                    outline: 2px solid #1a73e8 !important;
                    outline-offset: 0px !important;
                    background: rgba(26, 115, 232, 0.08) !important;
                    position: relative !important;
                }
            `;

    iframeDoc.head.appendChild(style);
    console.log('[样式注入] 元素选择样式已注入到iframe');
}

// 初始化预览区选中监听
function initPreviewSelection() {
    const previewFrame = document.getElementById('preview-frame');

    previewFrame.addEventListener('load', function () {
        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

        // 注入元素选择样式到iframe
        injectSelectionStylesToIframe(iframeDoc);

        // 监听文本选中事件
        iframeDoc.addEventListener('mouseup', handlePreviewSelection);
        iframeDoc.addEventListener('touchend', handlePreviewSelection);

        // 监听元素点击选中（仅在编辑模式下）
        // 监听元素悬停高亮（类似Chrome DevTools）
        iframeDoc.addEventListener('mouseover', handleElementHover);
        iframeDoc.addEventListener('mouseout', handleElementHoverOut);

        iframeDoc.addEventListener('click', handleElementClick);

        // 监听右键菜单
        iframeDoc.addEventListener('contextmenu', handleContextMenu);

        // 点击其他地方取消选中
        iframeDoc.addEventListener('mousedown', function (e) {
            const toolbar = document.getElementById('floating-toolbar');
            if (!toolbar.contains(e.target)) {
                // 如果不是点击已选中的元素，则取消选中
                if (selectedElement && e.target !== selectedElement && !selectedElement.contains(e.target)) {
                    const selection = iframeDoc.getSelection();
                    if (selection.toString().trim() === '') {
                        hideFloatingToolbar();
                        clearElementHighlight();
                    }
                }
            }
        });

        // 初始化图片可调整大小功能
        initResizableImages();
    });
}

// 初始化图片可调整大小功能
function initResizableImages() {
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const images = iframeDoc.querySelectorAll('img');

    images.forEach(img => {
        makeImageResizable(img);
    });

    console.log(`[图片调整] 已为 ${images.length} 张图片启用大小调整功能`);
}

// 使单个图片可调整大小
function makeImageResizable(img) {
    // 检查图片元素是否存在
    if (!img || !img.tagName || img.tagName !== 'IMG') {
        console.warn('[图片调整] 无效的图片元素', img);
        return;
    }

    // 避免重复添加
    if (img.hasAttribute('data-resizable')) return;
    img.setAttribute('data-resizable', 'true');

    // 添加选中状态样式
    img.style.cursor = 'move';
    img.style.transition = 'box-shadow 0.2s';

    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let resizeHandle = null;

    // 鼠标悬停时显示调整提示
    img.addEventListener('mouseenter', function () {
        if (!isResizing) {
            img.style.boxShadow = '0 0 0 2px #3b82f6';
        }
    });

    img.addEventListener('mouseleave', function () {
        if (!isResizing && !img.hasAttribute('data-selected-for-resize')) {
            img.style.boxShadow = '';
        }
    });

    // 点击图片显示调整手柄
    img.addEventListener('click', function (e) {
        e.stopPropagation();
        selectImageForResize(img);
    });

    // 双击图片恢复原始大小
    img.addEventListener('dblclick', function (e) {
        e.preventDefault();
        e.stopPropagation();
        img.style.width = '';
        img.style.height = '';
        syncPreviewToCode();
        updateStatus('✅ 图片已恢复原始大小');
    });
}

// 选中图片准备调整大小
function selectImageForResize(img) {
    if (!img) return;

    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame || !previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

    // 清除其他图片的选中状态
    iframeDoc.querySelectorAll('img[data-selected-for-resize]').forEach(other => {
        if (other !== img) {
            other.removeAttribute('data-selected-for-resize');
            other.style.boxShadow = '';
            removeResizeHandles(other);
        }
    });

    // 选中当前图片
    img.setAttribute('data-selected-for-resize', 'true');
    img.style.boxShadow = '0 0 0 2px #3b82f6';

    // 添加调整手柄
    addResizeHandles(img);
}

// 添加调整大小手柄
function addResizeHandles(img) {
    if (!img || !img.parentNode) return;

    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame || !previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

    // 移除已存在的手柄
    removeResizeHandles(img);

    // 创建容器
    const wrapper = iframeDoc.createElement('div');
    wrapper.className = 'image-resize-wrapper';
    wrapper.style.cssText = `
                position: relative;
                display: inline-block;
                max-width: 100%;
            `;

    // 将图片包装在容器中
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    // 创建8个调整手柄（四角+四边）
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    handles.forEach(position => {
        const handle = iframeDoc.createElement('div');
        handle.className = `resize-handle resize-handle-${position}`;
        handle.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: #3b82f6;
                    border: 2px solid white;
                    border-radius: 50%;
                    cursor: ${getCursorForHandle(position)};
                    z-index: 1000;
                `;

        // 定位手柄
        positionHandle(handle, position);

        // 添加拖拽事件
        handle.addEventListener('mousedown', (e) => startResize(e, img, position));

        wrapper.appendChild(handle);
    });
}

// 获取手柄的光标样式
function getCursorForHandle(position) {
    const cursors = {
        'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
        'e': 'e-resize', 'se': 'se-resize', 's': 's-resize',
        'sw': 'sw-resize', 'w': 'w-resize'
    };
    return cursors[position] || 'default';
}

// 定位手柄
function positionHandle(handle, position) {
    const positions = {
        'nw': { top: '-5px', left: '-5px' },
        'n': { top: '-5px', left: '50%', transform: 'translateX(-50%)' },
        'ne': { top: '-5px', right: '-5px' },
        'e': { top: '50%', right: '-5px', transform: 'translateY(-50%)' },
        'se': { bottom: '-5px', right: '-5px' },
        's': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
        'sw': { bottom: '-5px', left: '-5px' },
        'w': { top: '50%', left: '-5px', transform: 'translateY(-50%)' }
    };

    Object.assign(handle.style, positions[position]);
}

// 开始调整大小
function startResize(e, img, position) {
    if (!img || !e) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = img.offsetWidth;
    const startHeight = img.offsetHeight;
    const aspectRatio = startWidth / startHeight;

    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame || !previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

    function resize(e) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        // 根据手柄位置计算新尺寸
        if (position.includes('e')) newWidth = startWidth + deltaX;
        if (position.includes('w')) newWidth = startWidth - deltaX;
        if (position.includes('s')) newHeight = startHeight + deltaY;
        if (position.includes('n')) newHeight = startHeight - deltaY;

        // 保持宽高比（按住Shift键时）
        if (e.shiftKey) {
            if (position.includes('e') || position.includes('w')) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
        }

        // 限制最小尺寸
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        // 应用新尺寸
        img.style.width = newWidth + 'px';
        img.style.height = newHeight + 'px';
    }

    function stopResize() {
        iframeDoc.removeEventListener('mousemove', resize);
        iframeDoc.removeEventListener('mouseup', stopResize);
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);

        // 同步到编辑器
        syncPreviewToCode();
        updateStatus(`✅ 图片大小已调整为 ${Math.round(img.offsetWidth)}×${Math.round(img.offsetHeight)}px`);
    }

    iframeDoc.addEventListener('mousemove', resize);
    iframeDoc.addEventListener('mouseup', stopResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

// 移除调整手柄
function removeResizeHandles(img) {
    const wrapper = img.parentElement;
    if (wrapper && wrapper.className === 'image-resize-wrapper') {
        // 移除所有手柄
        wrapper.querySelectorAll('.resize-handle').forEach(handle => handle.remove());

        // 如果需要移除wrapper
        if (img.parentElement === wrapper && wrapper.parentElement) {
            wrapper.parentElement.insertBefore(img, wrapper);
            wrapper.remove();
        }
    }
}

// 处理元素悬停高亮（类似Chrome DevTools）
function handleElementHover(e) {
    // 只在启用编辑模式时才支持悬停高亮
    const toggleBtn = document.getElementById('toggle-edit-btn');
    if (!toggleBtn || !toggleBtn.textContent.includes('禁用')) {
        console.log('[元素悬停] 编辑模式未启用，按钮文本:', toggleBtn?.textContent);
        return;
    }

    // 避免在工具栏上触发
    if (e.target.closest && e.target.closest('.floating-toolbar')) {
        return;
    }

    let hoveredElement = e.target;

    // 如果已经选中，不显示悬停效果
    if (hoveredElement.classList && hoveredElement.classList.contains('preview-selection-highlight')) {
        return;
    }

    // 移除之前的悬停效果
    const previewFrame = document.getElementById('preview-frame');
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const previousHover = iframeDoc.querySelector('.preview-element-hover');
    if (previousHover) {
        previousHover.classList.remove('preview-element-hover');
        const tooltip = previousHover.querySelector('.element-tag-tooltip');
        if (tooltip) tooltip.remove();
    }

    // 添加悬停效果
    if (hoveredElement.classList) {
        hoveredElement.classList.add('preview-element-hover');
        console.log('[元素悬停] 已添加hover效果:', hoveredElement.tagName, hoveredElement.className);
    }

    e.stopPropagation();
}

// 处理元素悬停移出
function handleElementHoverOut(e) {
    const toggleBtn = document.getElementById('toggle-edit-btn');
    if (!toggleBtn || !toggleBtn.textContent.includes('禁用')) {
        return;
    }

    // 移除悬停效果
    if (e.target.classList) {
        e.target.classList.remove('preview-element-hover');
        const tooltip = e.target.querySelector('.element-tag-tooltip');
        if (tooltip) tooltip.remove();
    }
}


// 处理元素点击选中
function handleElementClick(e) {
    // 只在启用编辑模式时才支持元素选中
    const toggleBtn = document.getElementById('toggle-edit-btn');
    if (!toggleBtn || !toggleBtn.textContent.includes('禁用')) {
        return;
    }

    // 获取点击的元素
    let clickedElement = e.target;

    // 如果点击的是body或html，忽略
    if (clickedElement.tagName === 'BODY' || clickedElement.tagName === 'HTML') {
        return;
    }

    // 防止默认行为
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
    }

    // 高亮选中的元素
    highlightElement(clickedElement);

    // 保存选中信息
    selectedElement = clickedElement;
    selectionText = clickedElement.outerHTML;

    // 创建Range对象（用于后续插入内容）
    const previewFrame = document.getElementById('preview-frame');
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const range = iframeDoc.createRange();
    range.selectNode(clickedElement);
    selectedRange = range;

    // 显示浮动工具栏
    showFloatingToolbar(e);
}

// 高亮选中的元素
function highlightElement(element) {
    // 清除之前的高亮
    clearElementHighlight();

    // 移除悬停样式
    element.classList.remove('preview-element-hover');

    // 添加高亮样式
    element.classList.add('preview-selection-highlight');
    element.setAttribute('data-selected', 'true');

    console.log('[元素选中] 已选中元素:', element.tagName, element.className);
}

// 清除元素高亮
function clearElementHighlight() {
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const highlighted = iframeDoc.querySelectorAll('.preview-selection-highlight');
    highlighted.forEach(el => {
        el.classList.remove('preview-selection-highlight');
        el.removeAttribute('data-selected');
    });
}

// 处理右键菜单
function handleContextMenu(e) {
    // 只在启用编辑模式时才支持右键菜单
    const toggleBtn = document.getElementById('toggle-edit-btn');
    if (!toggleBtn || !toggleBtn.textContent.includes('禁用')) {
        return;
    }

    e.preventDefault();

    // 获取右键点击的元素
    let clickedElement = e.target;

    // 如果点击的是body或html，忽略
    if (clickedElement.tagName === 'BODY' || clickedElement.tagName === 'HTML') {
        return;
    }

    // 高亮选中的元素
    highlightElement(clickedElement);

    // 保存选中信息
    selectedElement = clickedElement;
    selectionText = clickedElement.outerHTML;

    // 创建Range对象
    const previewFrame = document.getElementById('preview-frame');
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const range = iframeDoc.createRange();
    range.selectNode(clickedElement);
    selectedRange = range;

    // 直接打开局部编辑对话框
    openLocalEditDialog();
}

// 处理预览区选中
function handlePreviewSelection(e) {
    const previewFrame = document.getElementById('preview-frame');
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const selection = iframeDoc.getSelection();

    selectionText = selection.toString().trim();

    if (selectionText.length > 0) {
        // 保存选中的Range对象
        if (selection.rangeCount > 0) {
            selectedRange = selection.getRangeAt(0);
            selectedElement = selectedRange.commonAncestorContainer;

            // 如果是文本节点，获取其父元素
            if (selectedElement.nodeType === 3) {
                selectedElement = selectedElement.parentElement;
            }
        }

        // 显示浮动工具栏
        showFloatingToolbar(e);
    } else {
        hideFloatingToolbar();
    }
}

// 显示浮动工具栏
function showFloatingToolbar(e) {
    const toolbar = document.getElementById('floating-toolbar');
    const previewFrame = document.getElementById('preview-frame');

    // 计算工具栏位置
    const frameRect = previewFrame.getBoundingClientRect();
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

    let rect;

    // 如果有选中的元素（元素选择模式），使用元素的边界
    if (selectedElement && selectedElement.getBoundingClientRect) {
        rect = selectedElement.getBoundingClientRect();
    } else {
        // 否则使用文本选区（文本选择模式）
        const selection = iframeDoc.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            rect = range.getBoundingClientRect();
        } else {
            return;
        }
    }

    // 工具栏位置：选中内容上方，居中
    let left = frameRect.left + rect.left + (rect.width / 2);
    let top = frameRect.top + rect.top - 50; // 上方50px

    // 防止超出屏幕
    const toolbarWidth = 400; // 预估宽度
    if (left + toolbarWidth / 2 > window.innerWidth) {
        left = window.innerWidth - toolbarWidth - 20;
    } else if (left - toolbarWidth / 2 < 0) {
        left = 20;
    } else {
        left = left - toolbarWidth / 2;
    }

    // 如果上方空间不够，显示在选中内容下方
    if (top < 60) {
        top = frameRect.top + rect.bottom + 10;
    }

    toolbar.style.left = left + 'px';
    toolbar.style.top = top + 'px';
    toolbar.classList.add('show');
}

// 隐藏浮动工具栏
function hideFloatingToolbar(clearSelection = true) {
    const toolbar = document.getElementById('floating-toolbar');
    toolbar.classList.remove('show');

    // 重置到主菜单状态
    const mainMenu = document.getElementById('toolbar-main-menu');
    const stylePanel = document.getElementById('toolbar-style-panel');
    if (mainMenu && stylePanel) {
        mainMenu.style.display = 'flex';
        stylePanel.style.display = 'none';
    }

    // 只有在明确要求清除时才清除选中状态
    if (clearSelection) {
        selectedRange = null;
        selectedElement = null;
        selectionText = '';
        clearElementHighlight();
    }
}

// 打开局部编辑对话框
function openLocalEditDialog() {
    if (!selectionText) {
        alert('请先选中要编辑的内容');
        return;
    }

    console.log('打开局部编辑对话框，选中内容:', selectionText);

    // 显示选中的内容（使用pre标签保持格式）
    const selectedTextDisplay = document.getElementById('selected-text-display');
    selectedTextDisplay.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px;">${selectionText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;

    // 清空之前的对话
    const localChatMessages = document.getElementById('local-chat-messages');
    localChatMessages.innerHTML = `
                <div class="local-chat-welcome">
                    💡 请描述您想对选中内容进行的修改，例如：<br>
                    • "改为加粗"<br>
                    • "添加红色背景"<br>
                    • "改写为更专业的表述"<br>
                    • "在此位置插入一个按钮"<br>
                    • "添加一个echarts柱状图"<br>
                    • "替换为一个echarts饼图展示数据"
                </div>
            `;

    // 隐藏预览区
    document.getElementById('local-edit-preview').style.display = 'none';

    // 显示对话框
    const modal = document.getElementById('local-edit-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 隐藏工具栏但不清除选中状态
    hideFloatingToolbar(false);

    // 聚焦输入框
    setTimeout(() => {
        document.getElementById('local-edit-input').focus();
    }, 300);
}

// 关闭局部编辑对话框
function closeLocalEditModal() {
    const modal = document.getElementById('local-edit-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// 发送局部编辑请求
async function sendLocalEditRequest() {
    const input = document.getElementById('local-edit-input');
    const instruction = input.value.trim();

    if (!instruction) {
        alert('请输入编辑指令');
        return;
    }

    // 不检查选中内容是否失效，保持选中状态
    // 添加用户消息
    addLocalMessage(instruction, 'user');
    input.value = '';

    // 检查选中内容
    if (!selectionText || selectionText.trim() === '') {
        addLocalMessage('❌ 错误：选中内容已丢失，请重新选择元素', 'ai');
        console.error('selectionText为空:', selectionText);
        return;
    }

    // 构建完整的提示词
    const prompt = `我选中了以下HTML内容：

${selectionText}

请根据以下指令修改上述HTML：${instruction}

要求：
1. 只返回修改后的完整HTML代码
2. 如果需要添加新功能（如图表、组件等），可以完全改变结构
3. 如果需要添加echarts图表，必须包含完整的CDN引入、图表容器div和初始化脚本
4. 如果需要添加其他库（如Chart.js等），也要包含完整的CDN和初始化代码
5. 当需要涉及mermaid图使用时参考以下方式实现，要结构清晰样式好看：
- Mermaid流程图引入方式：
    <script src="assets/libs/mermaid.min.js"></script>
    <script>mermaid.initialize({ startOnLoad: true });</script>
    - 禁止使用CDN或ES Module方式
    - 使用 class="mermaid" 包裹图表代码
    - 返回完整HTML结构
    6. 当需要涉及drawio图时，参考以下方式实现：
    - 外层用 <div class="mxgraph"> 包裹
        - 引入本地库：
        <script src="assets/libs/drawio-viewer.min.js"></script>
        - 注意语法不要错误，返回完整HTML结构
        7. 不要添加任何解释文字或markdown格式
        8. 确保HTML格式正确，可以直接使用
        9. 如果是简单修改（改颜色、文字等），保持原有结构即可`;



    console.log('发送给AI的prompt:', prompt);

    // 显示"AI思考中..."
    const chatMessages = document.getElementById('local-chat-messages');
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'local-message ai';
    thinkingMsg.textContent = 'AI思考中...';
    thinkingMsg.id = 'thinking-msg';
    chatMessages.appendChild(thinkingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 禁用发送按钮
    const sendBtn = document.querySelector('.local-send-btn');
    sendBtn.disabled = true;

    try {
        const isOpenAI = AI_API_TYPE === 'openai';
        const fetchUrl = isOpenAI ? OPENAI_API_URL : `${DIFY_API_URL}/chat-messages`;
        const fetchHeaders = isOpenAI
            ? { 'Content-Type': 'application/json' }
            : { 'Authorization': `Bearer ${DIFY_API_KEY}`, 'Content-Type': 'application/json' };
        const fetchBody = isOpenAI
            ? JSON.stringify({
                apiUrl: OPENAI_API_URL.replace('/api/chat', ''),
                apiType: 'openai',
                apiKey: OPENAI_API_KEY,
                model: OPENAI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                stream: true
            })
            : JSON.stringify({
                inputs: {},
                query: prompt,
                response_mode: 'streaming',
                conversation_id: '',
                user: currentUser ? currentUser.username : 'visual-editor-user'
            });

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: fetchBody
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.statusText}`);
        }

        // 处理流式响应（兼容 Dify 和 OpenAI 两种 SSE 格式）
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && trimmedLine.startsWith('data: ')) {
                    try {
                        const jsonStr = trimmedLine.slice(6);
                        if (!jsonStr || jsonStr === '[DONE]') continue;
                        const data = JSON.parse(jsonStr);

                        if (isOpenAI) {
                            const content = data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content;
                            if (content) {
                                aiResponse += content;
                                const thinkingElement = document.getElementById('thinking-msg');
                                if (thinkingElement) {
                                    thinkingElement.textContent = `AI思考中... (已接收 ${aiResponse.length} 字符)`;
                                }
                            }
                        } else {
                            if (data.event === 'message' || data.event === 'agent_message') {
                                aiResponse += data.answer;
                                const thinkingElement = document.getElementById('thinking-msg');
                                if (thinkingElement) {
                                    thinkingElement.textContent = `AI思考中... (已接收 ${aiResponse.length} 字符)`;
                                }
                            } else if (data.event === 'error') {
                                throw new Error(data.message || 'AI响应错误');
                            }
                        }
                    } catch (e) {
                        console.error('解析响应失败:', e);
                    }
                }
            }
        }

        if (aiResponse) {
            // 更新"思考中"消息为"生成预览中..."
            const thinkingElement = document.getElementById('thinking-msg');
            if (thinkingElement) {
                thinkingElement.textContent = '生成预览中...';
            }

            // 提取代码
            const modifiedCode = extractCode(aiResponse);

            // 移除"思考中"消息（只在成功生成预览后才移除）
            if (thinkingElement) {
                thinkingElement.remove();
            }

            // 显示AI回复
            addLocalMessage('✅ 已生成修改方案，请查看预览', 'ai');

            // 显示预览
            showLocalEditPreview(modifiedCode);
        } else {
            throw new Error('AI未返回有效响应');
        }
    } catch (error) {
        console.error('局部编辑请求失败:', error);

        // 移除"思考中"消息
        const thinkingElement = document.getElementById('thinking-msg');
        if (thinkingElement) {
            thinkingElement.remove();
        }

        addLocalMessage('请求失败: ' + error.message, 'ai');
    } finally {
        sendBtn.disabled = false;
    }
}

// 添加局部对话消息
function addLocalMessage(content, type) {
    const chatMessages = document.getElementById('local-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `local-message ${type}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 显示局部编辑预览
function showLocalEditPreview(modifiedCode) {
    const previewSection = document.getElementById('local-edit-preview');
    const previewBox = document.getElementById('local-preview-box');

    // 清空预览区
    previewBox.innerHTML = '';

    // 创建iframe来显示预览，参考实时预览的逻辑
    const previewIframe = document.createElement('iframe');
    previewIframe.style.width = '100%';
    previewIframe.style.minHeight = '200px';
    previewIframe.style.border = '1px solid #3e3e42';
    previewIframe.style.borderRadius = '4px';
    previewIframe.style.background = '#fff';

    previewBox.appendChild(previewIframe);

    // 使用srcdoc加载完整HTML到iframe中，这样echarts等外部库会在iframe上下文中正确加载
    previewIframe.srcdoc = modifiedCode;

    // 等待iframe加载完成
    previewIframe.onload = () => {
        console.log('[预览] 内容已加载到iframe');

        // 自动调整iframe高度以适应内容
        try {
            const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
            const contentHeight = iframeDoc.body.scrollHeight;
            if (contentHeight > 0) {
                previewIframe.style.height = Math.max(200, contentHeight + 20) + 'px';
            }
        } catch (e) {
            console.error('[预览] 调整iframe高度失败:', e);
        }
    };

    previewSection.style.display = 'block';

    // 保存修改后的代码
    window.pendingLocalEdit = modifiedCode;
}

// 应用局部编辑
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

        // 删除原内容并插入新内容
        selectedRange.deleteContents();

        // 提取并单独处理script标签
        const scripts = tempDiv.querySelectorAll('script');
        const scriptContents = [];
        const scriptSrcs = [];

        scripts.forEach(script => {
            if (script.src) {
                // 外部脚本（如echarts CDN）
                scriptSrcs.push(script.src);
            } else if (script.textContent) {
                // 内联脚本（如echarts初始化代码）
                scriptContents.push(script.textContent);
            }
            script.remove(); // 从tempDiv中移除，稍后单独处理
        });

        // 插入所有新节点（不包括script）
        while (tempDiv.firstChild) {
            selectedRange.insertNode(tempDiv.lastChild);
        }

        // 加载外部脚本
        let loadedScripts = 0;
        const totalScripts = scriptSrcs.length;

        const executeInlineScripts = () => {
            // 执行内联脚本
            scriptContents.forEach(content => {
                try {
                    // 在iframe的window上下文中执行
                    const scriptElement = iframeDoc.createElement('script');
                    scriptElement.textContent = content;
                    iframeDoc.body.appendChild(scriptElement);
                    console.log('[脚本执行] 内联脚本已执行');
                } catch (e) {
                    console.error('[脚本执行] 内联脚本执行失败:', e);
                }
            });
        };

        if (totalScripts > 0) {
            // 依次加载外部脚本
            scriptSrcs.forEach((src, index) => {
                // 检查是否已经加载过
                const existingScript = iframeDoc.querySelector(`script[src="${src}"]`);
                if (existingScript) {
                    console.log('[脚本加载] 已存在，跳过:', src);
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        executeInlineScripts();
                    }
                    return;
                }

                const scriptElement = iframeDoc.createElement('script');
                scriptElement.src = src;
                scriptElement.onload = () => {
                    console.log('[脚本加载] 成功:', src);
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        // 所有外部脚本加载完成后，执行内联脚本
                        setTimeout(executeInlineScripts, 100);
                    }
                };
                scriptElement.onerror = () => {
                    console.error('[脚本加载] 失败:', src);
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        executeInlineScripts();
                    }
                };
                iframeDoc.head.appendChild(scriptElement);
            });
        } else {
            // 没有外部脚本，直接执行内联脚本
            executeInlineScripts();
        }

        // 同步到编辑器
        syncPreviewToCode();

        // 重新渲染Mermaid图表（如果有新添加的）
        try {
            const iframeWindow = previewFrame.contentWindow;
            if (iframeWindow.mermaid && typeof iframeWindow.mermaid.run === 'function') {
                console.log('[Mermaid] 局部编辑后重新渲染图表');
                setTimeout(() => {
                    iframeWindow.mermaid.run().catch(err => {
                        console.error('[Mermaid] 重新渲染失败:', err);
                    });
                }, 150);
            }
        } catch (err) {
            console.warn('[Mermaid] 无法重新渲染:', err);
        }

        updateStatus('✅ 修改已应用');

        // 关闭对话框
        closeLocalEditModal();

        // 清理
        window.pendingLocalEdit = null;
        selectedRange = null;
        selectedElement = null;
        selectionText = '';
    } catch (error) {
        console.error('应用修改失败:', error);
        alert('应用修改失败: ' + error.message);
    }
}

// 拒绝局部编辑
function rejectLocalEdit() {
    document.getElementById('local-edit-preview').style.display = 'none';
    window.pendingLocalEdit = null;
    addLocalMessage('已拒绝此修改方案，请重新描述', 'ai');
}

// Enter键发送（Shift+Enter换行）
document.addEventListener('DOMContentLoaded', function () {
    const localInput = document.getElementById('local-edit-input');
    if (localInput) {
        localInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendLocalEditRequest();
            }
        });
    }
});

// 在选中位置插入图片
function openImageInsertAtSelection() {
    if (!selectedRange) {
        alert('请先选中要插入图片的位置');
        return;
    }

    // 检查登录状态
    if (!currentUser) {
        alert('请先登录后再使用图片上传功能');
        window.location.href = './login.html';
        return;
    }

    // 保存当前的Range和Element（打开对话框后会失效）
    savedRange = selectedRange;
    console.log('[图片插入] 已保存选中位置:', savedRange);

    // 设置上下文为选中位置插入
    currentImageContext = 'selection';

    // 打开图片上传对话框
    const modal = document.getElementById('image-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 初始化事件监听
    initImageUploadEvents();

    // 隐藏工具栏
    hideFloatingToolbar();
}

// 显示样式编辑面板
function showStylePanel() {
    if (!selectedElement) {
        alert('请先选中要调整样式的内容');
        return;
    }

    const mainMenu = document.getElementById('toolbar-main-menu');
    const stylePanel = document.getElementById('toolbar-style-panel');

    mainMenu.style.display = 'none';
    stylePanel.style.display = 'flex';

    // 读取当前样式并设置到控件
    loadCurrentStyles();

    updateStatus('🎨 样式编辑面板已打开');
}

// 显示主菜单
function showMainMenu() {
    const mainMenu = document.getElementById('toolbar-main-menu');
    const stylePanel = document.getElementById('toolbar-style-panel');

    mainMenu.style.display = 'flex';
    stylePanel.style.display = 'none';

    updateStatus('↩️ 已返回主菜单');
}

// 读取当前元素样式到控件
function loadCurrentStyles() {
    if (!selectedElement) return;

    const computedStyle = window.getComputedStyle(selectedElement);

    // 设置字号
    const fontSize = selectedElement.style.fontSize || computedStyle.fontSize;
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSize && fontSizeSelect) {
        fontSizeSelect.value = fontSize;
    }

    // 设置字体颜色
    const color = selectedElement.style.color || computedStyle.color;
    const fontColorPicker = document.getElementById('font-color-picker');
    if (color && fontColorPicker) {
        fontColorPicker.value = rgbToHex(color);
    }

    // 设置背景颜色
    const bgColor = selectedElement.style.backgroundColor || computedStyle.backgroundColor;
    const bgColorPicker = document.getElementById('bg-color-picker');
    if (bgColor && bgColorPicker) {
        bgColorPicker.value = rgbToHex(bgColor);
    }
}

// RGB颜色转HEX
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
        return '#000000';
    }

    if (rgb.startsWith('#')) {
        return rgb;
    }

    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) {
        return '#000000';
    }

    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);

    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// 应用字体大小
function applyFontSize(size) {
    if (!selectedElement) return;

    if (size) {
        selectedElement.style.fontSize = size;
        syncPreviewToCode();
        updateStatus(`✅ 已设置字号: ${size}`);
    } else {
        selectedElement.style.fontSize = '';
        syncPreviewToCode();
        updateStatus('✅ 已恢复默认字号');
    }
}

// 应用字体颜色
function applyFontColor(color) {
    if (!selectedElement) return;

    selectedElement.style.color = color;
    syncPreviewToCode();
    updateStatus(`✅ 已设置字体颜色: ${color}`);
}

// 应用背景颜色
function applyBgColor(color) {
    if (!selectedElement) return;

    selectedElement.style.backgroundColor = color;
    syncPreviewToCode();
    updateStatus(`✅ 已设置背景颜色: ${color}`);
}

// 切换粗体
function toggleBold() {
    if (!selectedElement) return;

    const currentWeight = selectedElement.style.fontWeight;
    if (currentWeight === 'bold' || currentWeight === '700') {
        selectedElement.style.fontWeight = 'normal';
        updateStatus('✅ 已取消粗体');
    } else {
        selectedElement.style.fontWeight = 'bold';
        updateStatus('✅ 已设置粗体');
    }

    syncPreviewToCode();
}

// 切换斜体
function toggleItalic() {
    if (!selectedElement) return;

    const currentStyle = selectedElement.style.fontStyle;
    if (currentStyle === 'italic') {
        selectedElement.style.fontStyle = 'normal';
        updateStatus('✅ 已取消斜体');
    } else {
        selectedElement.style.fontStyle = 'italic';
        updateStatus('✅ 已设置斜体');
    }

    syncPreviewToCode();
}

// 切换下划线
function toggleUnderline() {
    if (!selectedElement) return;

    const currentDecoration = selectedElement.style.textDecoration;
    if (currentDecoration.includes('underline')) {
        selectedElement.style.textDecoration = 'none';
        updateStatus('✅ 已取消下划线');
    } else {
        selectedElement.style.textDecoration = 'underline';
        updateStatus('✅ 已设置下划线');
    }

    syncPreviewToCode();
}

// 清除样式
function clearStyles() {
    if (!selectedElement) return;

    if (confirm('确定要清除所有自定义样式吗？')) {
        selectedElement.removeAttribute('style');
        syncPreviewToCode();
        updateStatus('✅ 已清除所有样式');

        // 重新加载控件状态
        loadCurrentStyles();
    }
}

// 删除选中内容
function deleteSelection() {
    if (!selectedRange) {
        alert('请先选中要删除的内容');
        return;
    }

    if (confirm('确定要删除选中的内容吗？')) {
        try {
            selectedRange.deleteContents();

            // 同步到编辑器
            syncPreviewToCode();
            updateStatus('✅ 内容已删除');

            hideFloatingToolbar();
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }
}

// ========== 图片上传功能 ==========
let selectedImageData = null;
let currentImageContext = 'ai-chat'; // 'ai-chat', 'selection', 'global'
let savedRange = null; // 保存打开对话框前的Range

// 打开图片上传对话框
function openImageUploadDialog() {
    // 检查登录状态
    if (!currentUser) {
        alert('请先登录后再使用图片上传功能');
        window.location.href = './login.html';
        return;
    }

    currentImageContext = 'ai-chat';
    const modal = document.getElementById('image-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 初始化事件监听
    initImageUploadEvents();
}

// 打开我的图片库对话框
function openMyImagesDialog() {
    // 检查登录状态
    if (!currentUser) {
        alert('请先登录后再使用图片库功能');
        window.location.href = './login.html';
        return;
    }

    currentImageContext = 'ai-chat';
    const modal = document.getElementById('image-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 切换到图片库标签页
    switchImageTab('library');

    // 初始化事件监听
    initImageUploadEvents();
    // 加载用户图片库
    loadUserImages();
}

// 关闭图片对话框
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    selectedImageData = null;
}

// 打开对话列表
async function openConversationList() {
    const modal = document.getElementById('conversation-list-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 加载对话列表
    await loadConversationList();
}

// 关闭对话列表
function closeConversationList() {
    const modal = document.getElementById('conversation-list-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// 新增对话
async function newConversation() {
    // 生成新的会话ID
    conversationId = '';

    // 清除localStorage中的当前会话ID
    localStorage.removeItem('current_conversation_id');

    // 版本管理：切换会话时清空当前编辑的代码块ID和版本标签
    currentEditingBlockId = null;
    lastSavedContent = '';
    const versionTagsContainer = document.getElementById('version-tags-container');
    if (versionTagsContainer) {
        versionTagsContainer.style.display = 'none';
        versionTagsContainer.innerHTML = '';
    }

    // 版本管理器切换会话（空ID表示新会话，异步）
    if (versionManager) {
        await versionManager.switchConversation('');
    }

    // 禁用保存按钮（新会话没有应用代码块）
    setSaveButtonEnabled(false);

    // 清空对话消息，保留初始欢迎消息
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
                <div class="chat-message">
                    <div class="message-avatar ai-avatar">AI</div>
                    <div class="message-content">
                                    你好！我是你的文档编写助手，可以尝试和我说：<br>
                                    我要给政府的领导汇报，请帮我根据以下内容生成汇报材料，着重突出数据对比的内容，要求层次结构分明，样式好看。<br>
                                    #项目建设方案<br>
                                    Xxxxx<br>
                                    #参考文档名字1<br>
                                    Xxxxx<br>
                                    #参考文档名字2<br>
                                    xxxxx<br>
                                    📝tips：<br>
                                    1、可以在"#参考文档名字"后的xxx中，丢给我以下材料，以文本形式复制进来<br>
                                    • 如: 项目的建设方案、参考的各类文档、示例风格稿等
                    </div>
                </div>
            `;

    // 清空编辑器内容
    if (editor) {
        editor.setValue('');
    }

    // 更新预览
    updatePreview();

    // 清空预览历史记录
    previewHistory = [];
    previewHistoryIndex = -1;

    // 显示提示
    updateStatus('✅ 已创建新对话');

    console.log('[新增对话] 会话已重置');
}

// 加载对话列表
async function loadConversationList() {
    const listBody = document.getElementById('conversation-list-body');
    listBody.innerHTML = '<div class="conversation-loading">加载中...</div>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            listBody.innerHTML = '<div class="conversation-empty"><div class="conversation-empty-icon">' + getIcon('lock') + '</div><p>请先登录查看对话记录</p></div>';
            return;
        }

        const { response, data } = await apiRequest(`${API_BASE_URL}/conversations/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('获取对话列表失败');
        }

        const conversations = data.data || data.conversations || [];

        if (conversations.length === 0) {
            listBody.innerHTML = '<div class="conversation-empty"><div class="conversation-empty-icon">' + getIcon('chat') + '</div><p>暂无对话记录</p></div>';
            return;
        }

        // 渲染对话列表
        listBody.innerHTML = conversations.map(conv => {
            const date = new Date(conv.created_at || conv.createdAt);
            const dateStr = date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const userMsg = conv.user_message || conv.userMessage || '';
            const preview = userMsg.length > 100 ? userMsg.substring(0, 100) + '...' : userMsg;
            const messageCount = Math.floor(parseFloat(conv.message_count || conv.messageCount || 0));
            const inputTokens = parseInt(conv.input_tokens || 0);
            const outputTokens = parseInt(conv.output_tokens || 0);
            const totalTokens = inputTokens + outputTokens;

            return `
                        <div class="conversation-item" onclick="loadConversation('${conv.session_id || conv.sessionId}')">
                            <div class="conversation-item-header">
                                <span class="conversation-item-id">会话 #${conv.session_id || conv.sessionId}</span>
                                <span class="conversation-item-date">${dateStr}</span>
                            </div>
                            <div class="conversation-item-preview">${escapeHtml(preview)}</div>
                            <div class="conversation-item-stats">
                                <span class="conversation-stat">${getIcon('chat')} ${messageCount} 条消息</span>
                                ${totalTokens > 0 ? `<span class="conversation-stat">${getIcon('edit')} ${totalTokens} tokens</span>` : ''}
                            </div>
                        </div>
                    `;
        }).join('');
    } catch (error) {
        console.error('加载对话列表失败:', error);
        listBody.innerHTML = '<div class="conversation-empty"><div class="conversation-empty-icon">' + getIcon('error') + '</div><p>加载失败，请稍后重试</p></div>';
    }
}

// 加载指定对话
async function loadConversation(sessionId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }

        // 显示加载状态
        const listBody = document.getElementById('conversation-list-body');
        listBody.innerHTML = '<div class="conversation-loading">加载对话中...</div>';

        const { response, data } = await apiRequest(`${API_BASE_URL}/conversations/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('获取对话详情失败');
        }

        const conversation = data.data || data.conversation || data;
        const messages = conversation.messages || [];
        const htmlContent = conversation.html_content || conversation.htmlContent || '';

        // 关闭对话列表弹窗
        closeConversationList();

        // 清空当前聊天内容
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        // 加载对话消息
        messages.forEach((msg, index) => {
            const messageType = msg.role === 'user' ? 'user' : 'ai';
            const content = msg.content || msg.message || '';

            // 为消息生成时间戳（使用消息的创建时间或索引）
            const messageTimestamp = msg.created_at ? new Date(msg.created_at).getTime() : (Date.now() + index * 1000);

            // AI消息需要格式化代码块
            if (messageType === 'ai') {
                const messagesContainer = document.getElementById('chat-messages');

                // 使用包装器
                const wrapper = document.createElement('div');
                wrapper.className = 'ai-message-wrapper';
                wrapper.dataset.timestamp = messageTimestamp;

                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message ai-message';

                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'message-avatar ai-avatar';
                avatarDiv.textContent = 'AI';

                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.setAttribute('data-original-content', content);
                contentDiv.innerHTML = formatMessageContent(content, false, messageTimestamp);

                messageDiv.appendChild(avatarDiv);
                messageDiv.appendChild(contentDiv);

                wrapper.appendChild(messageDiv);

                // 检查是否包含代码块，只有包含代码块才显示按钮
                const hasCodeBlock = contentDiv.querySelector('.code-block-placeholder[data-code]');
                if (hasCodeBlock) {
                    const insertBtn = document.createElement('button');
                    insertBtn.className = 'insert-code-btn-bottom';
                    insertBtn.textContent = '应用';
                    insertBtn.onclick = function () { insertCodeFromMessage(this); };
                    wrapper.appendChild(insertBtn);
                }

                messagesContainer.appendChild(wrapper);
            } else {
                // 用户消息直接显示
                addMessage(escapeHtml(content), messageType);
            }
        });

        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 设置会话ID
        conversationId = sessionId;

        // 保存到localStorage
        localStorage.setItem('current_conversation_id', sessionId);

        // 版本管理：切换到对应的会话（异步）
        if (versionManager) {
            await versionManager.switchConversation(sessionId);
            console.log('[版本管理] 已切换到会话:', sessionId);

            // 调试：查看加载的版本数据
            console.log('[版本管理] 版本数据结构:', versionManager.versions);
            console.log('[版本管理] 代码块数量:', Object.keys(versionManager.versions).length);

            // 尝试加载该会话最新的代码块版本
            const latestBlock = versionManager.getLatestCodeBlock();
            console.log('[版本管理] getLatestCodeBlock() 返回:', latestBlock);

            if (latestBlock) {
                console.log('[版本管理] 找到最新代码块:', {
                    blockId: latestBlock.blockId,
                    version: latestBlock.version,
                    currentVersion: latestBlock.currentVersion
                });

                // 设置当前编辑的代码块ID
                currentEditingBlockId = latestBlock.blockId;

                // 加载最新版本的内容到编辑器
                if (latestBlock.content && editor) {
                    editor.setValue(latestBlock.content);
                    updatePreview();
                    console.log('[版本管理] 已加载最新版本代码到编辑器');
                }

                // 显示版本标签
                renderVersionTags(latestBlock.blockId);

                // 启用保存按钮
                setSaveButtonEnabled(true);

                // 提示用户
                updateStatus(`已加载对话 #${sessionId}（包含 v${latestBlock.currentVersion} 代码）`);
            } else {
                console.log('[版本管理] 该会话无代码块版本');

                // 清空当前编辑的代码块ID
                currentEditingBlockId = null;
                lastSavedContent = '';
                const versionTagsContainer = document.getElementById('version-tags-container');
                if (versionTagsContainer) {
                    versionTagsContainer.style.display = 'none';
                    versionTagsContainer.innerHTML = '';
                }

                // 禁用保存按钮
                setSaveButtonEnabled(false);

                // 如果有HTML内容，加载到编辑器
                if (htmlContent && editor) {
                    editor.setValue(htmlContent);
                    updatePreview();
                }

                // 提示用户
                updateStatus(`已加载对话 #${sessionId}${htmlContent ? '（包含HTML内容）' : ''}`);
            }
        } else {
            // 没有版本管理器，使用原逻辑
            currentEditingBlockId = null;
            lastSavedContent = '';
            const versionTagsContainer = document.getElementById('version-tags-container');
            if (versionTagsContainer) {
                versionTagsContainer.style.display = 'none';
                versionTagsContainer.innerHTML = '';
            }

            setSaveButtonEnabled(false);

            if (htmlContent && editor) {
                editor.setValue(htmlContent);
                updatePreview();
            }

            updateStatus(`已加载对话 #${sessionId}${htmlContent ? '（包含HTML内容）' : ''}`);
        }
    } catch (error) {
        console.error('加载对话失败:', error);
        alert('加载对话失败，请稍后重试');
        // 重新加载列表
        await loadConversationList();
    }
}

// 切换图片标签页
function switchImageTab(tab) {
    // 更新标签激活状态
    document.querySelectorAll('.image-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.image-tab-pane').forEach(p => p.classList.remove('active'));

    if (tab === 'upload') {
        document.getElementById('tab-upload-image').classList.add('active');
        document.getElementById('upload-pane').classList.add('active');
    } else if (tab === 'library') {
        document.getElementById('tab-library-image').classList.add('active');
        document.getElementById('library-pane').classList.add('active');
        loadUserImages();
    } else if (tab === 'url') {
        document.getElementById('tab-url-image').classList.add('active');
        document.getElementById('url-pane').classList.add('active');
    }
}

// 初始化图片上传事件
function initImageUploadEvents() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('image-file-input');
    const widthSlider = document.getElementById('image-width-slider');
    const widthValue = document.getElementById('width-value');

    // 点击上传区域
    uploadArea.onclick = function (e) {
        if (e.target === uploadArea || e.target.classList.contains('upload-icon') ||
            e.target.classList.contains('upload-text') || e.target.classList.contains('upload-hint')) {
            fileInput.click();
        }
    };

    // 文件选择
    fileInput.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    };

    // 拖拽上传
    uploadArea.ondragover = function (e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    };

    uploadArea.ondragleave = function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    };

    uploadArea.ondrop = function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        } else {
            alert('请上传图片文件');
        }
    };

    // 宽度滑块
    widthSlider.oninput = function () {
        widthValue.textContent = this.value + '%';
    };
}

// 处理图片文件
async function handleImageFile(file) {
    // 验证文件大小
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('图片大小不能超过5MB');
        return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('只支持图片文件');
        return;
    }

    // 显示上传进度
    const progressDiv = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    progressDiv.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '上传中... 0%';

    // 创建FormData
    const formData = new FormData();
    formData.append('image', file);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            closeImageModal();
            window.location.href = './login.html';
            return;
        }

        // 模拟进度（实际应该用XMLHttpRequest监听上传进度）
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
                progressText.textContent = `上传中... ${progress}%`;
            }
        }, 100);

        const response = await fetch(`${API_BASE_URL}/images/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: formData
        });

        clearInterval(progressInterval);

        const data = await response.json();

        if (response.ok && data.success) {
            progressFill.style.width = '100%';
            progressText.textContent = '上传成功！';

            // 保存图片数据
            selectedImageData = data.data;

            setTimeout(() => {
                progressDiv.style.display = 'none';
                alert('图片上传成功！现在可以设置插入选项');
            }, 500);
        } else {
            throw new Error(data.message || '上传失败');
        }
    } catch (error) {
        console.error('上传图片错误:', error);
        alert('上传失败: ' + error.message);
        progressDiv.style.display = 'none';
    }
}

// 加载用户图片库
async function loadUserImages() {
    const grid = document.getElementById('image-library-grid');
    grid.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            grid.innerHTML = '<p class="loading-text">请先登录</p>';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/images/list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const images = data.data.images || [];

            if (images.length === 0) {
                grid.innerHTML = '<p class="loading-text">暂无图片，请先上传</p>';
                return;
            }

            grid.innerHTML = '';
            images.forEach(image => {
                const item = document.createElement('div');
                item.className = 'image-item';
                item.setAttribute('data-image-id', image.id);
                // 构建完整的图片URL（添加后端服务器地址）
                const backendURL = API_BASE_URL.replace('/api', '');
                const thumbnailSrc = (image.thumbnail_url || image.url).startsWith('http')
                    ? (image.thumbnail_url || image.url)
                    : `${backendURL}${image.thumbnail_url || image.url}`;
                item.innerHTML = `
        <img src="${thumbnailSrc}" alt="${image.original_name}">
        <button class="image-item-delete" onclick="deleteImageFromLibrary(event, ${image.id})" title="删除图片">×</button>
        <div class="image-item-info">
            <div class="image-item-name" title="${image.original_name}">${image.original_name}</div>
            <div class="image-item-size">${formatFileSize(image.file_size)}</div>
        </div>
        `;
                item.onclick = function (e) {
                    // 如果点击的是删除按钮，不触发选中
                    if (e.target.classList.contains('image-item-delete')) {
                        return;
                    }
                    // 移除其他选中状态
                    document.querySelectorAll('.image-item').forEach(i => i.classList.remove('selected'));
                    // 添加选中状态
                    this.classList.add('selected');
                    // 保存选中的图片数据
                    selectedImageData = image;
                };
                grid.appendChild(item);
            });
        } else {
            throw new Error(data.message || '加载失败');
        }
    } catch (error) {
        console.error('加载图片库错误:', error);
        grid.innerHTML = `<p class="loading-text">加载失败: ${error.message}</p>`;
    }
}

// 删除图片库中的图片
async function deleteImageFromLibrary(event, imageId) {
    event.stopPropagation();

    if (!confirm('确定要删除这张图片吗？删除后无法恢复。')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            updateStatus('✅ 图片已删除');

            // 从DOM中移除图片项
            const imageItem = document.querySelector(`[data-image-id="${imageId}"]`);
            if (imageItem) {
                imageItem.style.opacity = '0';
                imageItem.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    imageItem.remove();

                    // 检查是否还有图片
                    const grid = document.getElementById('image-library-grid');
                    if (grid.children.length === 0) {
                        grid.innerHTML = '<p class="loading-text">暂无图片，请先上传</p>';
                    }
                }, 300);
            }

            // 如果删除的是当前选中的图片，清除选中状态
            if (selectedImageData && selectedImageData.id === imageId) {
                selectedImageData = null;
            }
        } else {
            throw new Error(data.message || '删除失败');
        }
    } catch (error) {
        console.error('删除图片错误:', error);
        alert('删除失败: ' + error.message);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 预览URL图片
function previewImageUrl() {
    const urlInput = document.getElementById('image-url-input');
    const url = urlInput.value.trim();

    if (!url) {
        alert('请输入图片URL');
        return;
    }

    const previewArea = document.getElementById('url-preview-area');
    const previewImg = document.getElementById('url-preview-img');

    previewImg.src = url;
    previewImg.onload = function () {
        previewArea.style.display = 'block';
        selectedImageData = {
            url: url,
            original_name: 'external-image',
            type: 'url'
        };
    };

    previewImg.onerror = function () {
        alert('图片加载失败，请检查URL是否正确');
        previewArea.style.display = 'none';
    };
}

// 确认插入图片
function confirmInsertImage() {
    if (!selectedImageData) {
        alert('请先选择或上传一张图片');
        return;
    }

    // 获取插入选项
    const width = document.getElementById('image-width-slider').value;
    const align = document.querySelector('input[name="image-align"]:checked').value;
    const alt = document.getElementById('image-alt-input').value || selectedImageData.original_name;

    // 构建完整的图片URL（添加后端服务器地址）
    const backendURL = API_BASE_URL.replace('/api', '');
    const fullImageUrl = selectedImageData.url.startsWith('http')
        ? selectedImageData.url
        : `${backendURL}${selectedImageData.url}`;

    console.log('插入图片URL:', fullImageUrl);

    // 生成图片HTML代码
    const imageHtml = generateImageHtml(fullImageUrl, alt, width, align);

    // 根据上下文插入图片
    if (currentImageContext === 'ai-chat') {
        // AI对话模式：发送给AI让其智能插入
        insertImageViaAI(selectedImageData, imageHtml);
    } else if (currentImageContext === 'selection') {
        // 选中内容模式：插入到选中位置
        insertImageAtSelection(imageHtml);
    } else {
        // 全局模式：追加到编辑器末尾
        insertImageToEditor(imageHtml);
    }

    // 关闭对话框
    closeImageModal();
}

// 生成图片HTML代码
function generateImageHtml(url, alt, width, align) {
    let style = `width: ${width}%;`;

    if (align === 'center') {
        style += ' display: block; margin: 20px auto;';
    } else if (align === 'right') {
        style += ' float: right; margin: 0 0 10px 10px;';
    } else {
        style += ' float: left; margin: 0 10px 10px 0;';
    }

    return `<img src="${url}" alt="${alt}" style="${style}">`;
}

// 通过AI智能插入图片
function insertImageViaAI(imageData, imageHtml) {
    // 自动发送消息给AI
    const message = `我上传了一张图片：${imageData.original_name}，请帮我将它插入到合适的位置。图片代码：\n\n${imageHtml}`;

    // 添加到聊天消息
    addMessage(`[已上传图片: ${imageData.original_name}]`, 'user');

    // 发送给AI处理
    sendMessageToAI(message, { hasImage: true, imageHtml: imageHtml });
}

// 发送消息给AI（带图片信息）
async function sendMessageToAI(message, options = {}) {
    showTypingIndicator();

    try {
        const isOpenAI = AI_API_TYPE === 'openai';
        const fetchUrl = isOpenAI ? OPENAI_API_URL : `${DIFY_API_URL}/chat-messages`;
        const fetchHeaders = isOpenAI
            ? { 'Content-Type': 'application/json' }
            : { 'Authorization': `Bearer ${DIFY_API_KEY}`, 'Content-Type': 'application/json' };
        const fetchBody = isOpenAI
            ? JSON.stringify({
                apiUrl: OPENAI_API_URL.replace('/api/chat', ''),
                apiType: 'openai',
                apiKey: OPENAI_API_KEY,
                model: OPENAI_MODEL,
                messages: [{ role: 'user', content: message }],
                temperature: 0.7,
                stream: true
            })
            : JSON.stringify({
                inputs: {},
                query: message,
                response_mode: 'streaming',
                conversation_id: conversationId,
                user: currentUser ? currentUser.username : 'visual-editor-user'
            });

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: fetchBody
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        let messageElement = null;
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && trimmedLine.startsWith('data: ')) {
                    try {
                        const jsonStr = trimmedLine.slice(6);
                        if (!jsonStr || jsonStr === '[DONE]') continue;
                        const data = JSON.parse(jsonStr);

                        let contentChunk = '';
                        if (isOpenAI) {
                            contentChunk = data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content;
                        } else {
                            if (data.event === 'message' || data.event === 'agent_message') {
                                contentChunk = data.answer;
                            } else if (data.event === 'message_end') {
                                conversationId = data.conversation_id || conversationId;
                                if (messageElement) {
                                    messageElement.setAttribute("data-is-generating", "false");
                                    messageElement.innerHTML = formatMessageContent(aiResponse);
                                    const hasCodeBlock = messageElement.querySelector('.code-block-placeholder[data-code]');
                                    if (hasCodeBlock) {
                                        const wrapper = messageElement.closest('.ai-message-wrapper');
                                        if (wrapper && !wrapper.querySelector('.insert-code-btn-bottom')) {
                                            const insertBtn = document.createElement('button');
                                            insertBtn.className = 'insert-code-btn-bottom';
                                            insertBtn.textContent = '应用';
                                            insertBtn.onclick = function () { insertCodeFromMessage(this); };
                                            wrapper.appendChild(insertBtn);
                                        }
                                    }
                                }
                                if (options.hasImage && options.imageHtml && autoInsertCode) {
                                    setTimeout(() => { autoInsertToEditor(aiResponse); }, 500);
                                } else if (autoInsertCode && aiResponse.trim()) {
                                    setTimeout(() => { autoInsertToEditor(aiResponse); }, 500);
                                }
                                continue;
                            }
                        }

                        if (contentChunk) {
                            aiResponse += contentChunk;
                            if (!messageElement) {
                                hideTypingIndicator();
                                addMessage('', 'ai');
                                const messages = document.querySelectorAll('.message-content');
                                messageElement = messages[messages.length - 1];
                                messageElement.setAttribute("data-is-generating", "true");
                            }
                            messageElement.setAttribute('data-original-content', aiResponse);
                            messageElement.innerHTML = formatMessageContent(aiResponse, true);
                        }
                    } catch (e) {
                        console.error('解析错误:', e);
                    }
                }
            }
        }

        // OpenAI 模式下流结束时的收尾处理
        if (isOpenAI && messageElement) {
            messageElement.setAttribute("data-is-generating", "false");
            messageElement.innerHTML = formatMessageContent(aiResponse);
            const hasCodeBlock = messageElement.querySelector('.code-block-placeholder[data-code]');
            if (hasCodeBlock) {
                const wrapper = messageElement.closest('.ai-message-wrapper');
                if (wrapper && !wrapper.querySelector('.insert-code-btn-bottom')) {
                    const insertBtn = document.createElement('button');
                    insertBtn.className = 'insert-code-btn-bottom';
                    insertBtn.textContent = '应用';
                    insertBtn.onclick = function () { insertCodeFromMessage(this); };
                    wrapper.appendChild(insertBtn);
                }
            }
            if (options.hasImage && options.imageHtml && autoInsertCode) {
                setTimeout(() => { autoInsertToEditor(aiResponse); }, 500);
            } else if (autoInsertCode && aiResponse.trim()) {
                setTimeout(() => { autoInsertToEditor(aiResponse); }, 500);
            }
        }

    } catch (error) {
        hideTypingIndicator();
        addMessage(`发送失败: ${error.message}`, 'ai');
    }
}

// 插入图片到选中位置
function insertImageAtSelection(imageHtml) {
    // 优先使用保存的Range
    const rangeToUse = savedRange || selectedRange;

    if (!rangeToUse) {
        console.log('选中位置已失效，将插入到编辑器末尾');
        insertImageToEditor(imageHtml);
        updateStatus('⚠️ 选中位置已失效，图片已插入到编辑器末尾');
        return;
    }

    try {
        const previewFrame = document.getElementById('preview-frame');
        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

        // 创建临时div来解析HTML
        const tempDiv = iframeDoc.createElement('div');
        tempDiv.innerHTML = imageHtml;
        const imgElement = tempDiv.firstElementChild;

        console.log('[图片插入] 使用Range插入:', rangeToUse);

        // 使用保存的Range插入
        try {
            // 尝试删除选中内容（如果有的话）
            if (!rangeToUse.collapsed) {
                rangeToUse.deleteContents();
            }
            rangeToUse.insertNode(imgElement);
            console.log('✅ 图片已插入到选中位置');
        } catch (e) {
            console.warn('Range插入失败，尝试使用selectedElement:', e);
            // 如果Range失效，尝试使用selectedElement
            if (selectedElement && selectedElement.parentNode) {
                selectedElement.parentNode.insertBefore(imgElement, selectedElement.nextSibling);
                console.log('✅ 图片已插入到选中元素后面');
            } else {
                throw new Error('Range和Element都失效');
            }
        }

        // 同步到编辑器
        syncPreviewToCode();

        // 为新插入的图片启用调整大小功能
        makeImageResizable(imgElement);

        // 清除保存的Range
        savedRange = null;

        updateStatus('✅ 图片已插入成功');
    } catch (error) {
        console.error('选中位置插入失败:', error);
        alert('插入失败，将添加到编辑器末尾');
        insertImageToEditor(imageHtml);
        savedRange = null;
    }
}

// 插入图片到编辑器
function insertImageToEditor(imageHtml) {
    if (!editor) {
        alert('编辑器尚未加载');
        return;
    }

    const position = editor.getPosition();
    const line = position ? position.lineNumber : editor.getModel().getLineCount();
    const column = position ? position.column : 1;

    editor.executeEdits('insert-image', [{
        range: new monaco.Range(line, column, line, column),
        text: '\n' + imageHtml + '\n'
    }]);

    updatePreview();
    updateStatus('✅ 图片已插入到编辑器');
}

// 点击模态框外部关闭
document.getElementById('image-modal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeImageModal();
    }
});

// ========== 导出功能 ==========

// 打开导出对话框
function openExportDialog() {
    const modal = document.getElementById('export-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 计算统计信息
    calculateExportStats();
}

// 关闭导出对话框
function closeExportDialog() {
    const modal = document.getElementById('export-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// 计算导出统计信息
function calculateExportStats() {
    const htmlCode = editor.getValue();
    const htmlSize = new Blob([htmlCode]).size;

    // 提取所有图片URL
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    const images = [];
    let match;

    while ((match = imgRegex.exec(htmlCode)) !== null) {
        images.push(match[1]);
    }

    document.getElementById('html-size').textContent = formatBytes(htmlSize);
    document.getElementById('image-count').textContent = images.length + ' 张';
    document.getElementById('total-size').textContent = '预计 ' + formatBytes(htmlSize + images.length * 100 *
        1024); // 粗略估算
}

// 格式化字节大小
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 开始导出
async function startExport() {
    const exportType = document.querySelector('input[name="export-type"]:checked').value;
    const minify = document.getElementById('export-minify').checked;

    // 显示进度
    document.getElementById('export-progress').style.display = 'block';
    document.getElementById('start-export-btn').disabled = true;

    try {
        if (exportType === 'zip-images') {
            await exportAsZIP();
        } else if (exportType === 'pdf') {
            await exportAsPDF();
        } else if (exportType === 'docx') {
            await exportAsWord();
        } else {
            await exportAsHTMLOnly();
        }
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    } finally {
        document.getElementById('export-progress').style.display = 'none';
        document.getElementById('start-export-btn').disabled = false;
    }
}

// 导出为ZIP包
async function exportAsZIP() {
    updateExportProgress(0, '正在准备导出...');

    // 检查JSZip是否已加载
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip库未加载，请刷新页面后重试（Ctrl+Shift+R）');
    }

    const htmlCode = editor.getValue();
    const zip = new JSZip();

    // 提取所有图片URL
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    const images = [];
    let match;

    while ((match = imgRegex.exec(htmlCode)) !== null) {
        images.push(match[1]);
    }

    // 提取所有外部JavaScript库URL（包括echarts）
    const scriptRegex = /<script[^>]+src="([^"]+)"/gi;
    const scripts = [];
    while ((match = scriptRegex.exec(htmlCode)) !== null) {
        scripts.push(match[1]);
    }

    updateExportProgress(5, `找到 ${images.length} 张图片和 ${scripts.length} 个外部脚本`);

    let htmlWithLocalResources = htmlCode;

    // 下载外部JavaScript库
    const jsFolderName = 'js';

    // 需要跳过的 CDN（这些库需要在线环境或有 CORS 限制）
    const skipCDNs = [
        'cdn.tailwindcss.com',  // Tailwind CSS 运行时编译，必须在线使用
        'unpkg.com/@tailwindcss', // Tailwind CSS 相关
    ];

    for (let i = 0; i < scripts.length; i++) {
        const scriptUrl = scripts[i];
        updateExportProgress(5 + (i / (scripts.length + images.length)) * 40, `处理脚本 ${i + 1}/${scripts.length}...`);

        try {
            // 检查是否需要跳过
            const shouldSkip = skipCDNs.some(cdn => scriptUrl.includes(cdn));

            if (shouldSkip) {
                console.log(`[导出] 跳过在线CDN（需要网络环境）: ${scriptUrl}`);
                // 添加注释提示
                const comment = `\n<!-- 注意: 此脚本需要网络连接才能使用 -->`;
                const escapedUrl = scriptUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                htmlWithLocalResources = htmlWithLocalResources.replace(
                    new RegExp(`(<script[^>]*\\s+src=["']?${escapedUrl}["']?)`, 'gi'),
                    `${comment}\n$1`
                );
                continue;
            }

            // ⭐ 处理本地库文件（assets/libs/）
            if (scriptUrl.startsWith('assets/libs/') ||
                scriptUrl.startsWith('./assets/libs/') ||
                scriptUrl.startsWith('../assets/libs/')) {

                console.log(`[导出] 处理本地库: ${scriptUrl}`);

                try {
                    // 使用document.baseURI或当前页面URL作为基准来解析相对路径
                    // 这样无论本地还是远程访问都能正确解析
                    const baseURI = document.baseURI || window.location.href;
                    let fullUrl = new URL(scriptUrl, baseURI).href;

                    console.log(`[导出] 基准URI: ${baseURI}`);
                    console.log(`[导出] 完整URL: ${fullUrl}`);

                    // 从本地服务器读取
                    const response = await fetch(fullUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const scriptContent = await response.text();
                    const fileSize = (scriptContent.length / 1024 / 1024).toFixed(2);
                    console.log(`[导出] 文件大小: ${fileSize}MB`);

                    // 生成本地文件名
                    const fileName = scriptUrl.split('/').pop().split('?')[0];
                    const filePath = `${jsFolderName}/${fileName}`;

                    // 添加到ZIP
                    zip.file(filePath, scriptContent);

                    // 替换HTML中的路径
                    const escapedUrl = scriptUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    htmlWithLocalResources = htmlWithLocalResources.replace(
                        new RegExp(`<script([^>]*?)\\s+src=["']?${escapedUrl}["']?([^>]*?)>`, 'gi'),
                        (match, before, after) => {
                            // 移除integrity和crossorigin属性
                            before = before.replace(/\s+integrity=["'][^"']*["']/gi, '');
                            before = before.replace(/\s+crossorigin=["'][^"']*["']/gi, '');
                            after = after.replace(/\s+integrity=["'][^"']*["']/gi, '');
                            after = after.replace(/\s+crossorigin=["'][^"']*["']/gi, '');
                            return `<script${before} src="${filePath}"${after}>`;
                        }
                    );

                    console.log(`[导出] ✅ 本地库已打包: ${scriptUrl} -> ${filePath}`);
                    continue; // 处理完毕，跳过后续逻辑
                } catch (error) {
                    console.error(`[导出] ❌ 打包本地库失败: ${scriptUrl}`, error);
                    // 失败时继续，让后面的逻辑处理
                }
            }

            // 下载外部CDN脚本（如echarts）
            if (scriptUrl.startsWith('http://') || scriptUrl.startsWith('https://')) {
                const response = await fetch(scriptUrl);
                const scriptContent = await response.text();

                // 生成本地文件名
                const fileName = scriptUrl.split('/').pop().split('?')[0] || `script-${i}.js`;
                const filePath = `${jsFolderName}/${fileName}`;

                // 添加到ZIP
                zip.file(filePath, scriptContent);

                // 转义URL中的特殊字符用于正则表达式
                const escapedUrl = scriptUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // 替换HTML中的脚本路径 - 支持双引号、单引号和无引号的情况
                // 同时移除integrity和crossorigin属性（这些属性在本地使用时会导致问题）
                htmlWithLocalResources = htmlWithLocalResources.replace(
                    new RegExp(`<script([^>]*?)\\s+src=["']?${escapedUrl}["']?([^>]*?)>`, 'gi'),
                    (match, before, after) => {
                        // 移除integrity和crossorigin属性
                        before = before.replace(/\s+integrity=["'][^"']*["']/gi, '');
                        before = before.replace(/\s+crossorigin=["'][^"']*["']/gi, '');
                        after = after.replace(/\s+integrity=["'][^"']*["']/gi, '');
                        after = after.replace(/\s+crossorigin=["'][^"']*["']/gi, '');
                        return `<script${before} src="${filePath}"${after}>`;
                    }
                );

                console.log(`[导出] 已下载脚本: ${scriptUrl} -> ${filePath}`);
            }
        } catch (error) {
            console.warn('下载脚本失败（将保留CDN链接）:', scriptUrl);
            // 脚本下载失败时，保留原CDN链接，添加注释提示
            const comment = `\n<!-- 注意: ${scriptUrl} 下载失败，需要网络连接才能使用 -->`;
            const escapedUrl = scriptUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            htmlWithLocalResources = htmlWithLocalResources.replace(
                new RegExp(`(<script[^>]*\\s+src=["']?${escapedUrl}["']?)`, 'gi'),
                `${comment}\n$1`
            );
        }
    }

    // 下载图片
    const imageFolderName = 'images';
    const scriptCount = scripts.length;

    // 获取当前服务器的基础URL
    const currentHost = window.location.hostname;
    const apiHost = API_BASE_URL.replace('/api', '').replace(/^https?:\/\//, '');

    for (let i = 0; i < images.length; i++) {
        const imgUrl = images[i];
        updateExportProgress(45 + (i / images.length) * 40, `下载图片 ${i + 1}/${images.length}...`);

        try {
            // 判断是否是本地服务器的图片
            const isLocalImage =
                imgUrl.startsWith('/uploads/') || // 相对路径
                imgUrl.startsWith(`http://${currentHost}`) || // 当前主机
                imgUrl.startsWith(`http://localhost`) || // localhost
                imgUrl.startsWith(`http://127.0.0.1`) || // 127.0.0.1
                imgUrl.includes(apiHost) || // API服务器
                imgUrl.startsWith(API_BASE_URL.replace('/api', '')); // API基础URL

            if (isLocalImage) {
                console.log(`[导出] 下载图片: ${imgUrl}`);
                const response = await fetch(imgUrl);
                const blob = await response.blob();

                // 生成文件名（保留原始文件名）
                const fileName = imgUrl.split('/').pop().split('?')[0]; // 移除查询参数
                const filePath = `${imageFolderName}/${fileName}`;

                // 添加到ZIP
                zip.file(filePath, blob);

                // 转义URL用于正则表达式
                const escapedUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // 替换HTML中的图片路径（支持src和srcset）
                htmlWithLocalResources = htmlWithLocalResources.replace(
                    new RegExp(`(src|srcset)=["']?${escapedUrl}["']?`, 'gi'),
                    `$1="${filePath}"`
                );

                console.log(`[导出] 图片已保存: ${imgUrl} -> ${filePath}`);
            } else {
                console.log(`[导出] 跳过外部图片: ${imgUrl}`);
            }
        } catch (error) {
            console.error('[导出] 下载图片失败:', imgUrl, error);
        }
    }

    updateExportProgress(85, '生成HTML文件...');

    // 调试：输出替换后的脚本标签
    console.log('[导出调试] 检查HTML中的script标签替换结果:');
    const debugScriptRegex = /<script[^>]*src=["']?([^"'\s>]+)["']?[^>]*>/gi;
    let debugMatch;
    while ((debugMatch = debugScriptRegex.exec(htmlWithLocalResources)) !== null) {
        console.log('  - 脚本路径:', debugMatch[1]);
    }

    // 调试：输出替换后的图片标签
    console.log('[导出调试] 检查HTML中的img标签替换结果:');
    const debugImgRegex = /<img[^>]*src=["']?([^"'\s>]+)["']?[^>]*>/gi;
    let debugImgMatch;
    while ((debugImgMatch = debugImgRegex.exec(htmlWithLocalResources)) !== null) {
        console.log('  - 图片路径:', debugImgMatch[1]);
    }

    // 在HTML开头添加调试注释
    const debugComment = `<!--
导出调试信息:
- 导出时间: ${new Date().toLocaleString()}
- 脚本数量: ${scripts.length}
- 图片数量: ${images.length}
- 注意: 如果图表不显示，请检查浏览器控制台的错误信息
- 确认js文件夹中包含所有必要的库文件
-->
`;

    // 添加HTML文件（带调试注释）
    const finalHtml = debugComment + htmlWithLocalResources;
    zip.file('index.html', finalHtml);

    // 添加README说明文件
    const readmeContent = `# 导出说明

## 文件结构
\`\`\`
├── index.html          (主HTML文件)
├── js/                 (JavaScript库文件夹)
${scripts.length > 0 ? scripts.map((s, i) => `│   ├── ${s.split('/').pop().split('?')[0]}`).join('\n') : '│   (无外部脚本)'}
├── images/             (图片文件夹)
${images.length > 0 ? '│   ├── ... (图片文件)' : '│   (无图片)'}
└── README.txt          (本说明文件)
\`\`\`

## 使用方法
1. 解压此ZIP文件到任意文件夹
2. 双击打开 index.html 文件
3. 如果使用Chrome浏览器，建议右键 -> "打开方式" -> 选择Chrome

## 如果echarts图表不显示，请检查：

### 方法1：检查浏览器控制台
1. 按F12打开开发者工具
2. 切换到"Console"（控制台）标签
3. 查看是否有红色错误信息
4. 常见错误：
   - "Failed to load resource" - 资源加载失败
   - "echarts is not defined" - echarts未定义
   - "CORS policy" - 跨域问题（需要使用Web服务器）

### 方法2：检查文件结构
1. 确认js文件夹存在
2. 确认js文件夹中有echarts.min.js文件
3. 文件大小应该在几百KB到几MB之间

### 方法3：使用本地Web服务器
某些浏览器对本地文件有安全限制，建议使用本地服务器：

**使用Python启动：**
\`\`\`bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
\`\`\`

然后访问：http://localhost:8000

**使用Node.js启动：**
\`\`\`bash
npx http-server -p 8000
\`\`\`

### 方法4：检查HTML源代码
1. 右键查看网页源代码
2. 搜索 <script 标签
3. 确认src路径是相对路径（如：src="js/echarts.min.js"）
4. 不应该包含http://或https://的CDN链接

## 导出信息
- 导出时间: ${new Date().toLocaleString()}
- 脚本数量: ${scripts.length}
- 图片数量: ${images.length}
- 外部脚本列表:
${scripts.length > 0 ? scripts.map((s, i) => `  ${i + 1}. ${s}`).join('\n') : '  (无外部脚本)'}

## 技术支持
如果问题仍然存在，请检查：
1. 浏览器版本是否过旧
2. 是否启用了广告拦截插件（可能拦截JavaScript）
3. echarts版本是否兼容

## 常见问题

**Q: 为什么要使用本地Web服务器？**
A: 现代浏览器对本地文件有安全限制（CORS），使用Web服务器可以避免这些问题。

**Q: 图表显示空白但没有错误？**
A: 检查图表容器的宽度和高度是否正确设置（不能为0或auto）。

**Q: 部分功能正常但echarts不工作？**
A: echarts库可能未正确下载，检查js文件夹中的文件大小。
`;
    zip.file('README.txt', readmeContent);

    updateExportProgress(92, '打包ZIP文件...');

    // 生成ZIP并下载
    const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });

    updateExportProgress(100, '导出完成！');

    // 触发下载
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `smartoffice-export-${Date.now()}.zip`;
    link.click();

    setTimeout(() => {
        closeExportDialog();
    }, 1000);
}

// 导出为单个HTML（Base64嵌入）
async function exportAsHTMLWithBase64() {
    updateExportProgress(0, '正在准备导出...');

    const htmlCode = editor.getValue();
    const maxSize = parseInt(document.getElementById('base64-max-size').value) * 1024 || 500 * 1024;

    // 提取所有图片URL
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    const images = [];
    let match;

    while ((match = imgRegex.exec(htmlCode)) !== null) {
        images.push(match[1]);
    }

    updateExportProgress(10, `找到 ${images.length} 张图片`);

    let htmlWithBase64 = htmlCode;

    for (let i = 0; i < images.length; i++) {
        const imgUrl = images[i];
        updateExportProgress(10 + (i / images.length) * 80, `处理图片 ${i + 1}/${images.length}...`);

        try {
            if (imgUrl.startsWith('/uploads/') || imgUrl.startsWith('http://localhost')) {
                const response = await fetch(imgUrl);
                const blob = await response.blob();

                // 检查文件大小
                if (blob.size > maxSize) {
                    console.warn(`图片过大，跳过: ${imgUrl} (${formatBytes(blob.size)})`);
                    continue;
                }

                // 转换为Base64
                const base64 = await blobToBase64(blob);

                // 替换URL为Base64
                htmlWithBase64 = htmlWithBase64.replace(
                    new RegExp(imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    base64
                );
            }
        } catch (error) {
            console.error('处理图片失败:', imgUrl, error);
        }
    }

    updateExportProgress(100, '导出完成！');

    // 触发下载
    downloadHTML(htmlWithBase64, `smartoffice-export-${Date.now()}.html`);

    setTimeout(() => {
        closeExportDialog();
        alert('导出成功！HTML文件已下载');
    }, 1000);
}

// 导出为纯HTML
async function exportAsHTMLOnly() {
    updateExportProgress(50, '准备HTML文件...');

    const htmlCode = editor.getValue();

    updateExportProgress(100, '导出完成！');

    // 触发下载
    downloadHTML(htmlCode, `smartoffice-export-${Date.now()}.html`);

    setTimeout(() => {
        closeExportDialog();
        alert('导出成功！HTML文件已下载');
    }, 500);
}

// 导出为PDF
async function exportAsPDF() {
    updateExportProgress(0, '正在准备PDF导出...');

    try {
        // 获取预览iframe的内容
        const previewFrame = document.getElementById('preview-frame');
        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

        updateExportProgress(20, '正在渲染页面...');

        // 创建一个新的窗口来渲染PDF
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('无法打开打印窗口，请允许浏览器弹出窗口');
        }

        // 获取完整HTML
        const htmlContent = iframeDoc.documentElement.outerHTML;

        updateExportProgress(40, '正在生成PDF...');

        // 写入内容到新窗口
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // 等待资源加载完成
        await new Promise((resolve) => {
            if (printWindow.document.readyState === 'complete') {
                resolve();
            } else {
                printWindow.addEventListener('load', resolve);
            }
        });

        updateExportProgress(60, '正在配置打印选项...');

        // 给一点时间让样式生效
        await new Promise(resolve => setTimeout(resolve, 500));

        updateExportProgress(80, '正在打开打印对话框...');

        // 调用打印对话框
        printWindow.focus();
        printWindow.print();

        updateExportProgress(100, '导出完成！');

        setTimeout(() => {
            closeExportDialog();
        }, 1000);

        console.log('[PDF导出] 已打开打印对话框，请在打印对话框中选择"另存为PDF"');
    } catch (error) {
        console.error('[PDF导出] 导出失败:', error);
        throw error;
    }
}

// 导出为 Word 文档（高保真）
async function exportAsWord() {
    updateExportProgress(0, '🚀 启动 Word 导出...');

    try {
        // 检查 docx 库是否已加载（优先使用安全副本）
        let docxInstance;
        if (typeof docx !== 'undefined') {
            docxInstance = docx;
        } else if (typeof window._docxSafe !== 'undefined') {
            docxInstance = window._docxSafe;
            window.docx = window._docxSafe; // 恢复全局对象
        } else {
            throw new Error('docx.js 库未加载，请刷新页面后重试（Ctrl+Shift+R）');
        }

        console.log('[Word导出] 使用的 docx 实例:', docxInstance);

        // 检查 Word 导出模块是否已加载
        if (typeof window.exportHTMLToWord === 'undefined') {
            throw new Error('Word 导出模块未加载，请刷新页面后重试');
        }

        updateExportProgress(5, '📋 获取文档内容...');

        // 先在预览 iframe 中提取 ECharts 图表数据
        const previewIframe = document.getElementById('preview-frame');
        console.log('[Word导出] 预览iframe:', !!previewIframe);

        if (previewIframe && previewIframe.contentWindow) {
            try {
                updateExportProgress(7, '📊 提取 ECharts 图表数据...');
                const previewWindow = previewIframe.contentWindow;

                console.log('[Word导出] 预览窗口:', !!previewWindow);
                console.log('[Word导出] extractEChartsData 函数:', typeof previewWindow.extractEChartsData);

                // 调用预览窗口中的辅助函数提取图表数据
                if (typeof previewWindow.extractEChartsData === 'function') {
                    const chartCount = previewWindow.extractEChartsData();
                    if (chartCount > 0) {
                        console.log(`[Word导出] ✅ 已提取 ${chartCount} 个图表数据`);

                        // 等待一下确保数据写入完成
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } else {
                        console.log('[Word导出] ⚠️ 未找到图表数据');
                    }
                } else {
                    console.warn('[Word导出] ⚠️ 辅助函数未加载，跳过图表提取');
                }

                // 调用Mermaid和SVG图表提取函数
                console.log("[Word导出] extractDiagramData 函数:", typeof previewWindow.extractDiagramData);
                if (typeof previewWindow.extractDiagramData === "function") {
                    const diagramCount = await previewWindow.extractDiagramData();
                    if (diagramCount > 0) {
                        console.log("[Word导出] ✅ 已提取 " + diagramCount + " 个Mermaid/SVG图表数据");

                        // 等待一下确保数据写入完成
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } else {
                        console.log("[Word导出] ⚠️ 未找到Mermaid/SVG图表数据");
                    }
                } else {
                    console.warn("[Word导出] ⚠️ 图表提取辅助函数未加载");
                }
            } catch (error) {
                console.error('[Word导出] ❌ 图表数据提取失败:', error);
            }
        } else {
            console.warn('[Word导出] ⚠️ 无法访问预览iframe');
        }

        // 获取 HTML 内容（此时应该包含 data-echarts-image 属性）
        let htmlContent = editor.getValue();

        // 如果提取成功，从预览窗口获取实际的 HTML（包含 data-* 属性）
        if (previewIframe && previewIframe.contentDocument) {
            try {
                const previewBody = previewIframe.contentDocument.body;
                if (previewBody) {
                    htmlContent = previewBody.innerHTML;
                    console.log('[Word导出] ✅ 使用预览窗口的 HTML 内容');
                }
            } catch (error) {
                console.warn('[Word导出] ⚠️ 无法获取预览窗口的 HTML，使用编辑器内容');
            }
        }

        // 导出选项
        const options = {
            processImages: true,
            imageQuality: 0.9,
            imageMaxWidth: 1920,
            imageMaxHeight: 1080,
            detectComplexity: true,
            processCharts: false  // 已经在上面处理过了，不需要再次处理
        };

        // 进度回调
        const onProgress = (progress, message) => {
            updateExportProgress(Math.round(progress), message);
        };

        updateExportProgress(10, '🔄 开始转换...');

        // 调用导出函数
        const blob = await window.exportHTMLToWord(htmlContent, options, onProgress);

        updateExportProgress(95, '💾 准备下载...');

        // 计算文件大小
        const fileSizeKB = (blob.size / 1024).toFixed(2);
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        const fileSize = blob.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

        // 生成文件名
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `document-高保真-${timestamp}.docx`;

        // 触发下载
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        // 清理
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);

        updateExportProgress(100, '✅ 导出完成！');

        console.log(`[Word导出] 导出成功！文件: ${filename}, 大小: ${fileSize}`);

        // 显示成功消息
        setTimeout(() => {
            alert(`✅ Word 文档导出成功！\n\n文件名: ${filename}\n大小: ${fileSize}\n\n提示：如果样式不完美，这是正常的。Word 格式对复杂 CSS 的支持有限。`);
            closeExportDialog();
        }, 800);

    } catch (error) {
        console.error('[Word导出] 导出失败:', error);
        updateExportProgress(0, '');

        let errorMessage = '导出失败: ' + error.message;

        // 提供更友好的错误提示
        if (error.message.includes('docx.js')) {
            errorMessage += '\n\n请尝试：\n1. 刷新页面（Ctrl+Shift+R）\n2. 检查网络连接\n3. 稍后重试';
        }

        alert(errorMessage);
        throw error;
    }
}

// Blob转Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// 下载HTML文件
function downloadHTML(content, filename) {
    const blob = new Blob([content], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// 更新导出进度
function updateExportProgress(percent, text) {
    document.getElementById('export-progress-fill').style.width = percent + '%';
    document.getElementById('export-progress-text').textContent = text;
}

// 点击模态框外部关闭导出对话框
document.getElementById('export-modal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeExportDialog();
    }
});

// ==================== 版本管理功能 ====================

/**
 * 启用/禁用保存按钮
 * @param {boolean} enabled - 是否启用
 */
function setSaveButtonEnabled(enabled) {
    const saveBtn = document.getElementById('save-code-btn');
    if (saveBtn) {
        if (enabled) {
            saveBtn.disabled = false;
            saveBtn.title = '保存当前代码为新版本';
        } else {
            saveBtn.disabled = true;
            saveBtn.title = '请先应用AI代码块后再保存';
        }
    }
}

/**
 * 初始化版本管理器
 */
async function initVersionManagement() {
    if (!window.CodeBlockVersionManager) {
        console.error('[版本管理] CodeBlockVersionManager 未加载');
        return;
    }

    // 创建版本管理器实例，传入API基础URL和token获取函数
    versionManager = new CodeBlockVersionManager(
        API_BASE_URL,
        () => localStorage.getItem('token')
    );

    // 设置当前会话ID并加载数据
    if (conversationId) {
        await versionManager.switchConversation(conversationId);
    }

    // 页面加载时默认禁用保存按钮
    setSaveButtonEnabled(false);

    console.log('[版本管理] 版本管理器已初始化');
}

/**
 * 渲染版本标签
 * @param {string} blockId - 代码块ID
 */
function renderVersionTags(blockId) {
    if (!versionManager || !blockId) {
        return;
    }

    const versions = versionManager.getVersions(blockId);
    const currentVersion = versionManager.getCurrentVersion(blockId);
    const container = document.getElementById('version-tags-container');

    if (!container) {
        console.error('[版本管理] 版本标签容器未找到');
        return;
    }

    // 如果没有版本，隐藏容器
    if (!versions || versions.length === 0) {
        container.style.display = 'none';
        return;
    }

    // 显示容器并清空内容
    container.style.display = 'flex';
    container.innerHTML = '';

    // 渲染每个版本标签
    versions.forEach((v, index) => {
        const tag = document.createElement('div');
        tag.className = 'version-tag';

        // 当前激活版本
        if (v.version === currentVersion) {
            tag.classList.add('active');
        }

        // 原始版本
        if (v.isOriginal) {
            tag.classList.add('original');
        }

        // 唯一版本（不显示删除按钮）
        if (versions.length === 1) {
            tag.classList.add('only-version');
        }

        tag.textContent = `v${v.version}`;
        tag.dataset.version = v.version;
        tag.dataset.blockId = blockId;

        // 添加工具提示
        const tooltip = document.createElement('div');
        tooltip.className = 'version-tooltip';
        const date = new Date(v.timestamp);
        tooltip.textContent = `${v.isOriginal ? '原始版本 - ' : ''}${date.toLocaleString('zh-CN')}`;
        tag.appendChild(tooltip);

        // 鼠标悬停时动态计算tooltip位置（fixed定位，确保在最上层）
        tag.addEventListener('mouseenter', () => {
            const rect = tag.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            // 计算tooltip居中位置（在标签上方）
            const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            const top = rect.top - tooltipRect.height - 8;

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });

        // 调试：确认tooltip被创建
        console.log(`[版本管理] v${v.version} tooltip已创建:`, tooltip.textContent);

        // 添加删除按钮（非原始版本且不是唯一版本）
        if (!v.isOriginal && versions.length > 1) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'version-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteVersion(blockId, v.version);
            };
            tag.appendChild(deleteBtn);
        }

        // 点击切换版本
        tag.onclick = () => switchToVersion(blockId, v.version);

        // 添加进入动画
        tag.classList.add('entering');

        container.appendChild(tag);
    });

    console.log(`[版本管理] 已渲染 ${versions.length} 个版本标签`);
}

/**
 * 切换到指定版本
 * @param {string} blockId - 代码块ID
 * @param {number} version - 版本号
 */
async function switchToVersion(blockId, version) {
    if (!versionManager || !blockId) {
        return;
    }

    const currentVersion = versionManager.getCurrentVersion(blockId);
    if (currentVersion === version) {
        console.log(`[版本管理] 已经是版本 v${version}，无需切换`);
        return;
    }

    const content = versionManager.getVersionContent(blockId, version);
    if (!content) {
        showVersionNotification(`版本 v${version} 不存在`, 'error');
        return;
    }

    // 显示切换中状态
    showVersionNotification(`正在切换到 v${version}...`, 'loading');

    // 更新编辑器
    if (editor) {
        editor.setValue(content);
    }

    // 更新预览
    updatePreview();

    // 更新当前版本标记（异步）
    const success = await versionManager.switchVersion(blockId, version);

    if (success) {
        // 刷新UI
        renderVersionTags(blockId);

        // 显示通知
        showVersionNotification(`已切换到 v${version}`);

        console.log(`[版本管理] 已切换到版本 v${version}`);
    } else {
        showVersionNotification(`切换失败，请稍后重试`, 'error');
    }
}

/**
 * 删除版本
 * @param {string} blockId - 代码块ID
 * @param {number} version - 版本号
 */
async function deleteVersion(blockId, version) {
    if (!versionManager || !blockId) {
        return;
    }

    // 确认对话框
    const confirmed = confirm(
        `确定要删除版本 v${version} 吗？\n\n此操作不可撤销。`
    );

    if (!confirmed) {
        return;
    }

    // 显示删除中状态
    showVersionNotification(`正在删除 v${version}...`, 'loading');

    // 执行删除（异步）
    const success = await versionManager.deleteVersion(blockId, version);

    if (success) {
        // 如果删除的是当前版本，需要重新加载最新版本
        const currentVersion = versionManager.getCurrentVersion(blockId);
        if (currentVersion !== version) {
            // 自动切换到了其他版本，需要更新编辑器
            const content = versionManager.getVersionContent(blockId, currentVersion);
            if (content && editor) {
                editor.setValue(content);
                updatePreview();
            }
        }

        // 刷新UI
        renderVersionTags(blockId);

        // 显示通知
        showVersionNotification(`版本 v${version} 已删除`);

        console.log(`[版本管理] 已删除版本 v${version}`);
    } else {
        showVersionNotification(`删除失败，请稍后重试`, 'error');
    }
}

/**
 * 显示版本管理通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success/error/info/loading)
 * @returns {HTMLElement} 通知元素（用于后续移除）
 */
function showVersionNotification(message, type = 'success') {
    // 移除已存在的通知
    const existing = document.querySelector('.version-notification');
    if (existing) {
        existing.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'version-notification';
    notification.textContent = message;

    // 根据类型设置样式
    if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
    } else if (type === 'info') {
        notification.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
    } else if (type === 'loading') {
        notification.classList.add('loading');
        notification.style.animation = 'slideInRight 0.3s ease-out'; // 移除自动消失动画
    }

    document.body.appendChild(notification);

    // loading类型的通知不自动消失，其他类型3秒后自动移除
    if (type !== 'loading') {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    return notification;
}

// ==================== 暴露函数到全局作用域 ====================
// 为了让HTML中的onclick属性能够访问这些函数，需要将它们挂载到window对象上
window.toggleToolbar = toggleToolbar;
window.toggleCodeEditor = toggleCodeEditor;
window.toggleAutoInsert = toggleAutoInsert;
window.toggleCodeBlocks = toggleCodeBlocks;
window.runCode = runCode;
window.toggleEditMode = toggleEditMode;
window.undoPreviewEdit = undoPreviewEdit;
window.redoPreviewEdit = redoPreviewEdit;
window.clearCode = clearCode;
window.saveCode = saveCode;
window.openExportDialog = openExportDialog;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.newConversation = newConversation;
window.openConversationList = openConversationList;
// 版本管理函数
window.switchToVersion = switchToVersion;
window.deleteVersion = deleteVersion;
window.openImageUploadDialog = openImageUploadDialog;
window.openMyImagesDialog = openMyImagesDialog;
window.handleSendClick = handleSendClick;
window.openLocalEditDialog = openLocalEditDialog;
window.openImageInsertAtSelection = openImageInsertAtSelection;
window.showStylePanel = showStylePanel;
window.deleteSelection = deleteSelection;
window.showMainMenu = showMainMenu;
window.toggleBold = toggleBold;
window.toggleItalic = toggleItalic;
window.toggleUnderline = toggleUnderline;
window.clearStyles = clearStyles;
window.closeLocalEditModal = closeLocalEditModal;
window.sendLocalEditRequest = sendLocalEditRequest;
window.rejectLocalEdit = rejectLocalEdit;
window.applyLocalEdit = applyLocalEdit;
window.closeConversationList = closeConversationList;
window.closeImageModal = closeImageModal;
window.switchImageTab = switchImageTab;
window.previewImageUrl = previewImageUrl;
window.confirmInsertImage = confirmInsertImage;
window.closeExportDialog = closeExportDialog;
window.startExport = startExport;
window.exportAsWord = exportAsWord;
