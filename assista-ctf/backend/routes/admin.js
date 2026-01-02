const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Start Quiz
router.post('/start-quiz', verifyToken, verifyAdmin, async (req, res) => {
    const { duration } = req.body; // duration in minutes
    try {
        // Reset/Update settings (Active = 1)
        // We assume only one global quiz setting for now
        await db.query('DELETE FROM quiz_settings'); // Clear old settings
        await db.query(
            'INSERT INTO quiz_settings (is_active, start_time, duration_minutes) VALUES (1, CURRENT_TIMESTAMP, ?)',
            [duration || 60] // Default 60 mins
        );
        res.json({ message: 'Quiz started', duration: duration || 60 });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Stop Quiz
router.post('/stop-quiz', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await db.query('UPDATE quiz_settings SET is_active = 0');
        res.json({ message: 'Quiz stopped' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get Quiz Status (Public or User-accessible)
router.get('/quiz-status', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM quiz_settings ORDER BY id DESC LIMIT 1');
        if (result.rows.length === 0) {
            return res.json({ isActive: false });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
