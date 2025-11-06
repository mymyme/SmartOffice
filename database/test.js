#!/usr/bin/env node

const { testConnection, query } = require('./connection');

async function runTests() {
    console.log('🧪 开始数据库测试...\n');

    // 测试连接
    console.log('1️⃣ 测试数据库连接...');
    const connected = await testConnection();
    if (!connected) {
        console.log('❌ 数据库连接失败，请检查配置');
        process.exit(1);
    }

    // 测试查询
    console.log('\n2️⃣ 测试基本查询...');
    try {
        const tables = await query('SHOW TABLES');
        console.log('✅ 查询成功，找到表:', tables.map(t => Object.values(t)[0]).join(', '));
    } catch (error) {
        console.log('❌ 查询失败:', error.message);
    }

    // 测试系统配置
    console.log('\n3️⃣ 测试系统配置...');
    try {
        const configs = await query('SELECT config_key, config_value FROM system_config LIMIT 5');
        console.log('✅ 系统配置:');
        configs.forEach(config => {
            console.log(`   ${config.config_key}: ${config.config_value}`);
        });
    } catch (error) {
        console.log('❌ 系统配置查询失败:', error.message);
    }

    // 测试插入和查询
    console.log('\n4️⃣ 测试数据操作...');
    try {
        // 插入测试数据
        await query(`
            INSERT INTO code_snippets (user_id, title, language, code_content, description)
            VALUES (?, ?, ?, ?, ?)
        `, [1, '测试代码片段', 'javascript', 'console.log("Hello World");', '这是一个测试代码片段']);

        // 查询测试数据
        const snippets = await query('SELECT * FROM code_snippets WHERE title = ?', ['测试代码片段']);
        console.log('✅ 数据操作成功，插入的代码片段:', snippets[0].title);

        // 清理测试数据
        await query('DELETE FROM code_snippets WHERE title = ?', ['测试代码片段']);
        console.log('✅ 测试数据已清理');

    } catch (error) {
        console.log('❌ 数据操作失败:', error.message);
    }

    console.log('\n🎉 数据库测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };

