#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const config = {
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '', // 请根据实际情况修改
    multipleStatements: true
};

async function initDatabase() {
    let connection;

    try {
        console.log('🚀 开始初始化 Monaco Editor 数据库...');
        console.log(`📡 连接到 MySQL (${config.host}:${config.port})`);

        // 连接到MySQL服务器（不指定数据库）
        connection = await mysql.createConnection(config);
        console.log('✅ MySQL 连接成功');

        // 读取SQL脚本
        const sqlPath = path.join(__dirname, 'setup.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 执行数据库初始化脚本...');

        // 执行SQL脚本
        await connection.execute(sqlScript);

        console.log('✅ 数据库初始化完成！');
        console.log('📊 数据库名称: monaco_editor_db');
        console.log('👤 数据库用户: monaco_user');
        console.log('🔑 数据库密码: monaco_password_2024');
        console.log('');
        console.log('📋 已创建的表:');
        console.log('  - users (用户表)');
        console.log('  - code_snippets (代码片段表)');
        console.log('  - ai_conversations (AI对话记录表)');
        console.log('  - projects (项目表)');
        console.log('  - project_files (项目文件表)');
        console.log('  - system_config (系统配置表)');

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('💡 解决方案:');
            console.log('1. 确保 MySQL 服务正在运行');
            console.log('2. 检查端口 3307 是否正确');
            console.log('3. 检查 MySQL 用户权限');
            console.log('4. 手动运行: mysql -h localhost -P 3307 -u root -p < database/setup.sql');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };

