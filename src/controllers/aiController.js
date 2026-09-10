const aiService = require('../services/aiService');

async function getContext(req, res) {
    try {
        const contextString = await aiService.buildProfileContext(req.profileId);
        return res.status(200).json({ contextString });
    } catch (err) {
        console.error('Failed to aggregate second brain context:', err);
        return res.status(500).json({ error: 'Failed to aggregate context.' });
    }
}

async function chat(req, res) {
    const { messages, providerConfig, sessionId, approvalMode } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
    }

    try {
        const result = await aiService.sendChatCompletion({
            profileId: req.profileId,
            messages,
            providerConfig,
            allowTools: true,
            approvalMode: Boolean(approvalMode)
        });

        // If a sessionId was provided, persist the last user message and assistant reply safely
        if (sessionId) {
            try {
                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                if (lastUserMsg) {
                    await aiService.addMessage(req.profileId, sessionId, {
                        role: 'user',
                        content: lastUserMsg.content
                    });
                }

                await aiService.addMessage(req.profileId, sessionId, {
                    role: 'assistant',
                    content: result.reply,
                    tool_calls: result.tool_calls,
                    tool_executions: result.tool_executions,
                    pending_approvals: result.pending_approvals
                });
            } catch (dbErr) {
                console.error('Failed to persist AI messages to session:', dbErr);
            }
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('AI chat error:', err);
        return res.status(500).json({ error: err.message || 'AI request failed.' });
    }
}

async function executeTool(req, res) {
    const { name, args, sessionId, approvalId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Tool name is required.' });

    try {
        const result = await aiService.executeToolCall(req.profileId, name, args || {});

        if (sessionId) {
            try {
                await aiService.updatePendingApprovalStatus(req.profileId, sessionId, approvalId || name, 'approved', result);
            } catch (e) {
                // ignore session log failure
            }
        }

        return res.status(200).json({ success: true, tool: name, result });
    } catch (err) {
        console.error('Execute tool error:', err);
        return res.status(500).json({ error: err.message || 'Tool execution failed.' });
    }
}

async function rejectTool(req, res) {
    const { approvalId, sessionId } = req.body || {};
    if (sessionId && approvalId) {
        try {
            await aiService.updatePendingApprovalStatus(req.profileId, sessionId, approvalId, 'rejected');
        } catch (e) {
            // ignore
        }
    }
    return res.status(200).json({ success: true, approvalId, status: 'rejected' });
}

async function testConnection(req, res) {
    const { providerConfig } = req.body || {};
    try {
        const result = await aiService.testConnection(providerConfig);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}

async function getModels(req, res) {
    const { providerConfig } = req.body || {};
    try {
        const result = await aiService.fetchModels(providerConfig);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ ok: false, error: err.message });
    }
}

async function listSessions(req, res) {
    try {
        const sessions = await aiService.listSessions(req.profileId);
        return res.status(200).json({ sessions });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to list AI sessions.' });
    }
}

async function createSession(req, res) {
    const { title, provider, model } = req.body || {};
    try {
        const session = await aiService.createSession(req.profileId, {
            title: title || 'New Chat',
            provider: provider || 'gemini',
            model: model || 'gemini-2.0-flash'
        });
        return res.status(201).json(session);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to create AI session.' });
    }
}

async function getSession(req, res) {
    const { id } = req.params;
    try {
        const session = await aiService.getSession(req.profileId, id);
        if (!session) return res.status(404).json({ error: 'Session not found.' });
        return res.status(200).json(session);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch session.' });
    }
}

async function updateSession(req, res) {
    const { id } = req.params;
    const { title, model } = req.body || {};
    try {
        const updated = await aiService.updateSession(req.profileId, id, { title, model });
        if (!updated) return res.status(404).json({ error: 'Session not found.' });
        return res.status(200).json(updated);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update session.' });
    }
}

async function deleteSession(req, res) {
    const { id } = req.params;
    try {
        await aiService.deleteSession(req.profileId, id);
        return res.status(200).json({ success: true, id });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete session.' });
    }
}

async function getSessionMessages(req, res) {
    const { id } = req.params;
    try {
        const messages = await aiService.getMessages(req.profileId, id);
        return res.status(200).json({ messages });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
}

module.exports = {
    getContext,
    chat,
    executeTool,
    rejectTool,
    testConnection,
    getModels,
    listSessions,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    getSessionMessages,
};
