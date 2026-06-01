// SmartOffice 数据库配置文件
module.exports = {
    // 数据库连接配置
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4',
        timezone: '+08:00',
        // 数据库数据目录
        dataDir: process.env.DB_DATA_DIR,
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
        name: 'SmartOffice',
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
