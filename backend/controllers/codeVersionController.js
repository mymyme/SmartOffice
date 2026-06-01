// 代码块版本管理控制器
const db = require('../config/database');

/**
 * 保存代码块版本
 * POST /api/code-versions/save
 */
async function saveVersion(req, res) {
    try {
        const userId = req.user.id;
        const {
            session_id,
            block_id,
            version,
            content,
            is_original = false
        } = req.body;

        // 参数校验
        if (!session_id || !block_id || !version || !content) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要参数',
                data: null
            });
        }

        // 版本号必须是正整数
        if (!Number.isInteger(version) || version < 1) {
            return res.status(400).json({
                code: 400,
                message: '版本号必须是正整数',
                data: null
            });
        }

        // 内容长度限制（10MB）
        const contentSize = Buffer.byteLength(content, 'utf8');
        if (contentSize > 10 * 1024 * 1024) {
            return res.status(400).json({
                code: 400,
                message: '内容大小超过限制（最大10MB）',
                data: null
            });
        }

        // 检查版本是否已存在
        const checkSql = `
            SELECT id FROM code_block_versions
            WHERE session_id = ? AND block_id = ? AND version = ?
        `;
        const existing = await db.query(checkSql, [session_id, block_id, version]);

        if (existing.length > 0) {
            return res.status(409).json({
                code: 409,
                message: '该版本已存在',
                data: null
            });
        }

        // 插入版本数据
        const insertSql = `
            INSERT INTO code_block_versions
            (user_id, session_id, block_id, version, content, is_original, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        const result = await db.query(insertSql, [
            userId,
            session_id,
            block_id,
            version,
            content,
            is_original ? 1 : 0
        ]);

        // 更新或插入当前版本跟踪
        const upsertCurrentSql = `
            INSERT INTO code_block_current_versions
            (user_id, session_id, block_id, current_version, updated_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            current_version = VALUES(current_version),
            updated_at = NOW()
        `;

        await db.query(upsertCurrentSql, [userId, session_id, block_id, version]);

        return res.json({
            code: 200,
            message: 'success',
            data: {
                id: result.insertId,
                session_id,
                block_id,
                version,
                is_original,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[代码版本] 保存版本错误:', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误',
            data: null
        });
    }
}

/**
 * 获取会话的所有版本数据
 * GET /api/code-versions/session/:session_id
 */
async function getSessionVersions(req, res) {
    try {
        const userId = req.user.id;
        const { session_id } = req.params;

        if (!session_id) {
            return res.status(400).json({
                code: 400,
                message: '缺少会话ID',
                data: null
            });
        }

        // 获取所有版本数据
        const versionsSql = `
            SELECT
                block_id,
                version,
                content,
                is_original,
                created_at
            FROM code_block_versions
            WHERE user_id = ? AND session_id = ?
            ORDER BY block_id, version
        `;

        const versions = await db.query(versionsSql, [userId, session_id]);

        // 获取当前版本信息
        const currentSql = `
            SELECT block_id, current_version
            FROM code_block_current_versions
            WHERE user_id = ? AND session_id = ?
        `;

        const currentVersions = await db.query(currentSql, [userId, session_id]);

        // 组织数据结构
        const blocks = {};
        let totalVersions = 0;

        versions.forEach(v => {
            if (!blocks[v.block_id]) {
                blocks[v.block_id] = {
                    versions: [],
                    currentVersion: 1
                };
            }

            blocks[v.block_id].versions.push({
                version: v.version,
                content: v.content,
                isOriginal: v.is_original === 1,
                timestamp: new Date(v.created_at).getTime()
            });

            totalVersions++;
        });

        // 设置当前版本
        currentVersions.forEach(cv => {
            if (blocks[cv.block_id]) {
                blocks[cv.block_id].currentVersion = cv.current_version;
            }
        });

        return res.json({
            code: 200,
            message: 'success',
            data: {
                session_id,
                blocks,
                total_blocks: Object.keys(blocks).length,
                total_versions: totalVersions
            }
        });

    } catch (error) {
        console.error('[代码版本] 获取会话版本错误:', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误',
            data: null
        });
    }
}

/**
 * 更新当前激活版本
 * PUT /api/code-versions/current
 */
async function updateCurrentVersion(req, res) {
    try {
        const userId = req.user.id;
        const {
            session_id,
            block_id,
            current_version
        } = req.body;

        // 参数校验
        if (!session_id || !block_id || !current_version) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要参数',
                data: null
            });
        }

        // 验证版本是否存在
        const checkSql = `
            SELECT id FROM code_block_versions
            WHERE user_id = ? AND session_id = ? AND block_id = ? AND version = ?
        `;

        const existing = await db.query(checkSql, [userId, session_id, block_id, current_version]);

        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '指定版本不存在',
                data: null
            });
        }

        // 更新当前版本
        const updateSql = `
            INSERT INTO code_block_current_versions
            (user_id, session_id, block_id, current_version, updated_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            current_version = VALUES(current_version),
            updated_at = NOW()
        `;

        await db.query(updateSql, [userId, session_id, block_id, current_version]);

        return res.json({
            code: 200,
            message: '当前版本已更新',
            data: {
                block_id,
                current_version
            }
        });

    } catch (error) {
        console.error('[代码版本] 更新当前版本错误:', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误',
            data: null
        });
    }
}

/**
 * 删除代码块版本
 * DELETE /api/code-versions/delete
 */
async function deleteVersion(req, res) {
    try {
        const userId = req.user.id;
        const {
            session_id,
            block_id,
            version
        } = req.body;

        // 参数校验
        if (!session_id || !block_id || !version) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要参数',
                data: null
            });
        }

        // 检查是否为原始版本
        const checkSql = `
            SELECT is_original FROM code_block_versions
            WHERE user_id = ? AND session_id = ? AND block_id = ? AND version = ?
        `;

        const existing = await db.query(checkSql, [userId, session_id, block_id, version]);

        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '版本不存在',
                data: null
            });
        }

        if (existing[0].is_original === 1) {
            return res.status(403).json({
                code: 403,
                message: '不能删除原始版本',
                data: null
            });
        }

        // 删除版本
        const deleteSql = `
            DELETE FROM code_block_versions
            WHERE user_id = ? AND session_id = ? AND block_id = ? AND version = ?
        `;

        await db.query(deleteSql, [userId, session_id, block_id, version]);

        // 获取剩余版本数量
        const countSql = `
            SELECT COUNT(*) as count FROM code_block_versions
            WHERE user_id = ? AND session_id = ? AND block_id = ?
        `;

        const countResult = await db.query(countSql, [userId, session_id, block_id]);
        const remainingVersions = countResult[0].count;

        return res.json({
            code: 200,
            message: '版本删除成功',
            data: {
                deleted_version: version,
                remaining_versions: remainingVersions
            }
        });

    } catch (error) {
        console.error('[代码版本] 删除版本错误:', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误',
            data: null
        });
    }
}

module.exports = {
    saveVersion,
    getSessionVersions,
    updateCurrentVersion,
    deleteVersion
};

