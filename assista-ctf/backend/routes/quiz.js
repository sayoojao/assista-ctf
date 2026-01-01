const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Start a Quiz Session
router.post('/start', verifyToken, async (req, res) => {
    try {
        // Create a new session
        // SQLite: run returns 'this.lastID'
        const result = await db.query('INSERT INTO quiz_sessions (user_id) VALUES (?)', [req.user.id]);

        // Fetch the ID (using lastID from 'run') workaround if wrapper supported it directly.
        // My wrapper resolves { ...this, rows: [] } for run. So result.lastID should exist if using sqlite3 context.
        // Let's verify wrapper logic. 
        // "resolve(method === 'run' ? { ...this, rows: [] } : { rows });" -> 'this' in run callback is the statement object which has lastID.

        const sessionId = result.lastID;
        res.json({ sessionId, message: 'Quiz started' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Submit Answer (Status Update)
router.post('/answer', verifyToken, async (req, res) => {
    const { questionId, optionId } = req.body;
    // Note: sessionId is optional now. If not provided, we find or create a "Kanban" session for this user.

    try {
        // Find an active session or create one for "Kanban Mode"
        // Let's just create one session per user for "General Play" and reuse it?
        // Or just create a new session for every single answer? (Bad for stats).
        // Best: Find the most recent open session OR just use a dedicated "Kanban" session.
        // Let's reuse the latest session if it's not "completed".

        let sessionId;
        const activeSessionRes = await db.query('SELECT id FROM quiz_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);

        if (activeSessionRes.rows.length > 0) {
            sessionId = activeSessionRes.rows[0].id;
        } else {
            // Create new
            const newSes = await db.query('INSERT INTO quiz_sessions (user_id) VALUES (?)', [req.user.id]);
            sessionId = newSes.lastID;
        }

        // Check if option is correct
        const optRes = await db.query('SELECT is_correct FROM options WHERE id = ?', [optionId]);
        const isCorrect = optRes.rows.length > 0 && optRes.rows[0].is_correct === 1;

        // Check if already answered?
        // "users can take each question... and answer". Usually once.
        const existingRes = await db.query('SELECT id FROM user_responses WHERE session_id = ? AND question_id = ?', [sessionId, questionId]);

        if (existingRes.rows.length > 0) {
            // Update? Or deny? Let's Allow retry? No, usually quiz is one-shot.
            // But for Kanban, maybe retry until correct? User didn't specify.
            // Let's assume one-shot for points integrity.
            return res.status(400).send('Question already answered');
        }

        await db.query(
            'INSERT INTO user_responses (session_id, question_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?)',
            [sessionId, questionId, optionId, isCorrect]
        );

        // Update Total Score of session immediately?
        if (isCorrect) {
            const qRes = await db.query('SELECT points FROM questions WHERE id = ?', [questionId]);
            const points = qRes.rows[0].points;
            await db.query('UPDATE quiz_sessions SET total_score = total_score + ? WHERE id = ?', [points, sessionId]);
        }

        res.json({ message: 'Answer recorded', isCorrect });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Finish Quiz & Get Result
router.post('/finish', verifyToken, async (req, res) => {
    const { sessionId } = req.body;
    try {
        // Verify session belongs to user
        const sessionRes = await db.query('SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
        if (sessionRes.rows.length === 0) return res.status(403).send('Invalid session');

        // Calculate Score
        // Sum points of questions where user answered correctly
        const scoreRes = await db.query(`
            SELECT SUM(q.points) as total_score 
            FROM user_responses ur
            JOIN questions q ON ur.question_id = q.id
            WHERE ur.session_id = ? AND ur.is_correct = 1
         `, [sessionId]);

        const score = scoreRes.rows[0].total_score || 0;

        // Update Session
        await db.query('UPDATE quiz_sessions SET completed_at = CURRENT_TIMESTAMP, total_score = ? WHERE id = ?', [score, sessionId]);

        res.json({ sessionId, totalScore: score });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        // Sum of all scores per user (simplest version)
        // Or Max score per user? Usually "Total Score" implies cumulative or best run. 
        // Let's do cumulative for now as per "rank users by total score".

        const result = await db.query(`
            SELECT u.username, SUM(qs.total_score) as grand_total
            FROM users u
            JOIN quiz_sessions qs ON u.id = qs.user_id
            WHERE u.role != 'ADMIN'
            GROUP BY u.id
            ORDER BY grand_total DESC
            LIMIT 10
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
