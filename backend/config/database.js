// 数据库连接池配置
const mysql = require('mysql2/promise');
const dbConfig = require('../../database/config');
require('dotenv').config();

// 创建连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || dbConfig.database.host,
    port: process.env.DB_PORT || dbConfig.database.port,
    user: process.env.DB_USER || dbConfig.database.user,
    password: process.env.DB_PASSWORD || dbConfig.database.password,
    database: process.env.DB_NAME || dbConfig.database.database,
    charset: dbConfig.database.charset,
    timezone: dbConfig.database.timezone,
    connectionLimit: dbConfig.database.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 测试连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        console.log(`   数据库: ${process.env.DB_NAME || dbConfig.database.database}`);
        console.log(`   主机: ${process.env.DB_HOST || dbConfig.database.host}:${process.env.DB_PORT || dbConfig.database.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 执行查询（带错误处理）
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('数据库查询错误:', error.message);
        console.error('SQL:', sql);
        console.error('参数:', params);
        throw error;
    }
}

// 开始事务
async function transaction(callback) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    tables: dbConfig.tables
};

