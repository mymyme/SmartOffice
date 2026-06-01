/**
 * 常量配置文件
 * 包含：版本号、API配置、AI服务配置等
 */

// 使用立即执行函数避免污染全局作用域
(function () {
    // 版本信息
    const APP_VERSION = '2.0.1';
    const VERSION_KEY = 'app_version';
    const LAST_UPDATE_KEY = 'last_update_time';

    // AI 服务配置
    // AI_API_TYPE: 'dify' 使用 Dify 接口，'openai' 使用兼容 OpenAI API 的任意供应商
    const AI_API_TYPE = window.AI_API_TYPE || 'dify';
    const DIFY_API_URL = window.DIFY_API_URL || 'http://localhost:5000/v1';
    const DIFY_API_KEY = window.DIFY_API_KEY || '';
    // OpenAI 兼容供应商配置（AI_API_TYPE 为 'openai' 时生效）
    const OPENAI_API_URL = window.OPENAI_API_URL || 'http://localhost:3008/api/chat';
    const OPENAI_API_KEY = window.OPENAI_API_KEY || '';
    const OPENAI_MODEL = window.OPENAI_MODEL || 'gpt-4o';

    // 自动检测 API 地址（后端默认端口 3006）
    const isRemoteAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    const API_BASE_URL = window.API_BASE_URL ||
        (isRemoteAccess
            ? `http://${window.location.hostname}:3006/api`
            : 'http://localhost:3006/api');

    console.log('API地址:', API_BASE_URL, '(访问方式:', isRemoteAccess ? '远程' : '本地', ')');

    // Monaco Editor CDN
    const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs';

    // 导出配置到全局（这是唯一需要暴露的对象）
    window.AppConfig = {
        VERSION: APP_VERSION,
        VERSION_KEY,
        LAST_UPDATE_KEY,
        AI_API_TYPE,
        DIFY_API_URL,
        DIFY_API_KEY,
        OPENAI_API_URL,
        OPENAI_API_KEY,
        OPENAI_MODEL,
        API_BASE_URL,
        MONACO_CDN,
        isRemoteAccess
    };
})();
