// 数据库迁移脚本
const fs = require('fs').promises;
const path = require('path');
const db = require('./config');

async function runMigrations() {
    try {
        console.log('🔄 开始执行数据库迁移...');

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);

        // 按文件名排序
        const sqlFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of sqlFiles) {
            console.log(`\n📄 执行迁移: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');

            // 分割多个SQL语句
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                try {
                    await db.query(statement);
                } catch (error) {
                    // 忽略"表已存在"的错误
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                }
            }

            console.log(`✅ ${file} 执行完成`);
        }

        console.log('\n✅ 所有迁移执行完成！');
        process.exit(0);
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        process.exit(1);
    }
}

runMigrations();

