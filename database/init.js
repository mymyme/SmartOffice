// 数据库初始化脚本 - 创建管理员账户
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// 管理员初始信息
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@monaco-editor.local';
const ADMIN_PASSWORD = 'Ad123456';
const ADMIN_FULL_NAME = '系统管理员';

async function initDatabase() {
    let connection;

    try {
        console.log('🔧 开始数据库初始化...');

        // 创建数据库连接
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database,
            charset: config.database.charset
        });

        console.log('✅ 数据库连接成功');

        // 检查管理员账户是否存在
        const [existingAdmin] = await connection.execute(
            'SELECT id, username FROM users WHERE username = ? OR role = ?',
            [ADMIN_USERNAME, 'admin']
        );

        if (existingAdmin.length > 0) {
            console.log('⚠️  管理员账户已存在，跳过创建');
            console.log(`   用户名: ${existingAdmin[0].username}`);
            console.log(`   用户ID: ${existingAdmin[0].id}`);

            // 询问是否重置密码
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('是否重置管理员密码？(y/n): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
                    await connection.execute(
                        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
                        [passwordHash, existingAdmin[0].id]
                    );
                    console.log('✅ 管理员密码已重置为: Ad123456');
                }
                readline.close();
                connection.end();
            });

            return;
        }

        // 创建管理员账户
        console.log('📝 正在创建管理员账户...');
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
            [ADMIN_USERNAME, ADMIN_EMAIL, passwordHash, 'admin', ADMIN_FULL_NAME]
        );

        console.log('✅ 管理员账户创建成功！');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 管理员登录信息：');
        console.log(`   用户名: ${ADMIN_USERNAME}`);
        console.log(`   密码:   ${ADMIN_PASSWORD}`);
        console.log(`   邮箱:   ${ADMIN_EMAIL}`);
        console.log(`   用户ID: ${result.insertId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  请在首次登录后修改默认密码！');

        // 创建操作日志
        await connection.execute(
            `INSERT INTO user_logs (user_id, action, description, status, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [result.insertId, 'ACCOUNT_CREATED', '系统初始化创建管理员账户', 'success']
        );

        // 确保头像目录存在
        const avatarDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(avatarDir)) {
            fs.mkdirSync(avatarDir, { recursive: true });
            console.log(`✅ 创建头像目录: ${avatarDir}`);
        }

        // 创建默认头像目录
        const assetsDir = path.join(__dirname, '../frontend/assets/avatars');
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
            console.log(`✅ 创建默认头像目录: ${assetsDir}`);
        }

        console.log('🎉 数据库初始化完成！');

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        console.error('错误详情:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行初始化
if (require.main === module) {
    initDatabase().catch(console.error);
}

module.exports = initDatabase;
