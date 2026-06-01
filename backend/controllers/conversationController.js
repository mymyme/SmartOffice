// 对话记录控制器
const db = require('../config/database');

/**
 * 保存对话记录
 * POST /api/conversations/save
 */
async function saveConversation(req, res) {
    try {
        const userId = req.user.id;
        const {
            session_id,
            user_message,
            ai_message,
            input_tokens = 0,
            output_tokens = 0,
            model = null,
            html_content = null
        } = req.body;

        if (!session_id || !user_message || !ai_message) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        const total_tokens = input_tokens + output_tokens;

        // 检查表结构是否支持html_content字段
        let userInsertSql = `INSERT INTO ${db.tables.aiConversations}
             (user_id, session_id, message_type, content, input_tokens, output_tokens, total_tokens, model`;
        let aiInsertSql = userInsertSql;
        let userValues = [userId, session_id, user_message, input_tokens, input_tokens, model];
        let aiValues = [userId, session_id, ai_message, output_tokens, total_tokens, model];

        if (html_content !== null) {
            userInsertSql += `, html_content) VALUES (?, ?, 'user', ?, ?, 0, ?, ?, ?)`;
            aiInsertSql += `, html_content) VALUES (?, ?, 'ai', ?, 0, ?, ?, ?, ?)`;
            userValues.push(html_content);
            aiValues.push(html_content);
        } else {
            userInsertSql += `) VALUES (?, ?, 'user', ?, ?, 0, ?, ?)`;
            aiInsertSql += `) VALUES (?, ?, 'ai', ?, 0, ?, ?, ?)`;
        }

        // 保存用户消息
        await db.query(userInsertSql, userValues);

        // 保存AI回复
        await db.query(aiInsertSql, aiValues);

        return res.json({
            success: true,
            message: '对话记录已保存',
            data: {
                session_id,
                tokens: {
                    input: input_tokens,
                    output: output_tokens,
                    total: total_tokens
                }
            }
        });

    } catch (error) {
        console.error('保存对话记录错误:', error);
        return res.status(500).json({
            success: false,
            message: '保存对话记录失败'
        });
    }
}

/**
 * 获取用户对话历史
 * GET /api/conversations/history
 */
async function getHistory(req, res) {
    try {
        const userId = req.user.id;
        const { session_id, limit = 50 } = req.query;

        let sql = `
            SELECT id, session_id, message_type, content,
                   input_tokens, output_tokens, total_tokens, model, created_at
            FROM ${db.tables.aiConversations}
            WHERE user_id = ?
        `;
        const params = [userId];

        if (session_id) {
            sql += ' AND session_id = ?';
            params.push(session_id);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const history = await db.query(sql, params);

        return res.json({
            success: true,
            data: { history }
        });

    } catch (error) {
        console.error('获取对话历史错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取对话历史失败'
        });
    }
}

/**
 * 获取用户对话统计
 * GET /api/conversations/stats
 */
async function getStats(req, res) {
    try {
        const userId = req.user.id;

        const stats = await db.query(
            `SELECT
                COUNT(DISTINCT session_id) as conversation_count,
                COALESCE(SUM(input_tokens), 0) as total_input_tokens,
                COALESCE(SUM(output_tokens), 0) as total_output_tokens,
                COALESCE(SUM(total_tokens), 0) as total_tokens
             FROM ${db.tables.aiConversations}
             WHERE user_id = ?`,
            [userId]
        );

        return res.json({
            success: true,
            data: stats[0]
        });

    } catch (error) {
        console.error('获取对话统计错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取对话统计失败'
        });
    }
}

/**
 * 获取对话列表（按会话分组）
 * GET /api/conversations/list
 */
async function getConversationList(req, res) {
    try {
        const userId = req.user.id;
        const { limit = 50 } = req.query;

        // 确保limit是安全的整数
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);

        // 先获取会话列表（注意：MySQL不支持LIMIT使用占位符，需要直接拼接）
        const sessionSql = `
            SELECT
                c.session_id,
                MIN(c.created_at) as created_at,
                MAX(c.created_at) as updated_at,
                COUNT(DISTINCT CASE WHEN c.message_type = 'user' THEN c.id END) as message_count,
                SUM(CASE WHEN c.message_type = 'user' THEN c.input_tokens ELSE 0 END) as input_tokens,
                SUM(CASE WHEN c.message_type = 'ai' THEN c.output_tokens ELSE 0 END) as output_tokens
            FROM ai_conversations c
            WHERE c.user_id = ?
            GROUP BY c.session_id
            ORDER BY MIN(c.created_at) DESC
            LIMIT ${safeLimit}
        `;

        const conversations = await db.query(sessionSql, [userId]);

        // 为每个会话获取第一条用户消息
        for (let conv of conversations) {
            const msgSql = `
                SELECT content
                FROM ai_conversations
                WHERE user_id = ? AND session_id = ? AND message_type = 'user'
                ORDER BY created_at ASC
                LIMIT 1
            `;
            const messages = await db.query(msgSql, [userId, conv.session_id]);
            conv.user_message = messages.length > 0 ? messages[0].content : null;
        }

        return res.json({
            success: true,
            data: conversations
        });

    } catch (error) {
        console.error('获取对话列表错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取对话列表失败'
        });
    }
}

/**
 * 获取指定会话的详细内容
 * GET /api/conversations/:sessionId
 */
async function getConversationDetail(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const sql = `
            SELECT id, session_id, message_type, content,
                   input_tokens, output_tokens, total_tokens, model,
                   html_content, created_at
            FROM ai_conversations
            WHERE user_id = ? AND session_id = ?
            ORDER BY created_at ASC
        `;

        const messages = await db.query(sql, [userId, sessionId]);

        if (messages.length === 0) {
            return res.status(404).json({
                success: false,
                message: '对话不存在'
            });
        }

        // 获取最新的HTML内容（从最后一条消息中获取）
        const htmlContent = messages[messages.length - 1].html_content || null;

        // 格式化消息
        const formattedMessages = messages.map(msg => ({
            role: msg.message_type === 'user' ? 'user' : 'assistant',
            content: msg.content,
            created_at: msg.created_at
        }));

        return res.json({
            success: true,
            data: {
                session_id: sessionId,
                messages: formattedMessages,
                html_content: htmlContent,
                created_at: messages[0].created_at,
                updated_at: messages[messages.length - 1].created_at
            }
        });

    } catch (error) {
        console.error('获取对话详情错误:', error);
        return res.status(500).json({
            success: false,
            message: '获取对话详情失败'
        });
    }
}

module.exports = {
    saveConversation,
    getHistory,
    getStats,
    getConversationList,
    getConversationDetail
};

