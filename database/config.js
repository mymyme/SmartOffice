// Monaco Editor 数据库配置文件
module.exports = {
    // 数据库连接配置
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER || 'monaco_user',
        password: process.env.DB_PASSWORD || 'monaco_password_2024',
        database: process.env.DB_NAME || 'monaco_editor_db',
        charset: 'utf8mb4',
        timezone: '+08:00',
        // 数据库数据目录（指向外部硬盘）
        dataDir: process.env.DB_DATA_DIR || '/media/storage/monaco_editor_db',
        // 连接池配置
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    },

    // 数据库表名
    tables: {
        users: 'users',
        sessions: 'sessions',
        userLogs: 'user_logs',
        codeSnippets: 'code_snippets',
        aiConversations: 'ai_conversations',
        projects: 'projects',
        projectFiles: 'project_files',
        systemConfig: 'system_config'
    },

    // 应用配置
    app: {
        name: 'Monaco Editor AI',
        version: '2.0.0',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxAvatarSize: 2 * 1024 * 1024, // 2MB
        supportedLanguages: [
            'javascript', 'typescript', 'python', 'java',
            'cpp', 'csharp', 'go', 'rust', 'php', 'ruby',
            'swift', 'kotlin', 'html', 'css', 'scss', 'less',
            'json', 'xml', 'yaml', 'markdown', 'sql'
        ],
        allowedAvatarTypes: ['image/jpeg', 'image/png', 'image/gif'],
        allowedAvatarExts: ['.jpg', '.jpeg', '.png', '.gif']
    }
};
