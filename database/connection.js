const mysql = require('mysql2/promise');
const config = require('./config');

// 创建连接池
const pool = mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    charset: config.database.charset,
    timezone: config.database.timezone,
    connectionLimit: config.database.connectionLimit,
    acquireTimeout: config.database.acquireTimeout,
    timeout: config.database.timeout,
    reconnect: config.database.reconnect
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        console.log(`📊 数据库: ${config.database.database}`);
        console.log(`🌐 主机: ${config.database.host}:${config.database.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 执行查询
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
}

// 执行事务
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
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

// 关闭连接池
async function closePool() {
    try {
        await pool.end();
        console.log('✅ 数据库连接池已关闭');
    } catch (error) {
        console.error('❌ 关闭连接池时出错:', error.message);
    }
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closePool
};

