const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../db');
const { verifyAdmin } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// --- Categories ---

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Create category (Admin)
router.post('/categories', verifyAdmin, async (req, res) => {
    const { name, description } = req.body;
    try {
        await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).send('Category created');
    } catch (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).send('Category exists');
        res.status(500).send('Server error');
    }
});

// --- Questions ---

// Upload Questions CSV (Admin)
router.post('/upload', verifyAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Expected CSV Headers: Category, Difficulty, Content, Points, Options (separated by |), CorrectOption
            // Example: Science, EASY, "What is water?", 10, "H2O|CO2|O2", "H2O"

            let successCount = 0;
            let errors = [];

            for (const row of results) {
                try {
                    // 1. Find or Create Category
                    let catId;
                    const catRes = await db.query('SELECT id FROM categories WHERE name = ?', [row.Category]);
                    if (catRes.rows.length > 0) {
                        catId = catRes.rows[0].id;
                    } else {
                        await db.query('INSERT INTO categories (name) VALUES (?)', [row.Category]);
                        const newCat = await db.query('SELECT id FROM categories WHERE name = ?', [row.Category]); // SQLite doesn't return ID easily in basic wrapper, fetch it back
                        catId = newCat.rows[0].id;
                    }

                    // 2. Insert Question
                    await db.query(
                        'INSERT INTO questions (category_id, content, difficulty, points) VALUES (?, ?, ?, ?)',
                        [catId, row.Content, row.Difficulty, row.Points]
                    );

                    // Get Question ID (Need to fetch latest for this category/content as SQLite wrapper workaround)
                    const qRes = await db.query('SELECT id FROM questions WHERE content = ? ORDER BY id DESC LIMIT 1', [row.Content]);
                    const qId = qRes.rows[0].id;

                    // 3. Insert Options
                    const options = row.Options.split('|');
                    for (const opt of options) {
                        const isCorrect = opt.trim() === row.CorrectOption.trim();
                        await db.query('INSERT INTO options (question_id, content, is_correct) VALUES (?, ?, ?)', [qId, opt.trim(), isCorrect]);
                    }
                    successCount++;
                } catch (err) {
                    console.error(err);
                    errors.push(`Failed to import row: ${row.Content}`);
                }
            }

            fs.unlinkSync(req.file.path); // Cleanup
            res.json({ message: `Imported ${successCount} questions`, errors });
        });
});

// Create Single Question (Admin)
router.post('/create', verifyAdmin, async (req, res) => {
    const { categoryId, content, difficulty, points, options, correctOptionIndex } = req.body;
    // Options is array of strings. correctOptionIndex is int.

    if (!categoryId || !content || !difficulty || !points || !options || options.length < 2) {
        return res.status(400).send('Invalid data');
    }

    try {
        // Insert Question
        const qRes = await db.query(
            'INSERT INTO questions (category_id, content, difficulty, points) VALUES (?, ?, ?, ?)',
            [categoryId, content, difficulty, points]
        );
        const qId = qRes.lastID; // SQLite specific

        // Insert Options
        for (let i = 0; i < options.length; i++) {
            const isCorrect = i === parseInt(correctOptionIndex);
            await db.query(
                'INSERT INTO options (question_id, content, is_correct) VALUES (?, ?, ?)',
                [qId, options[i], isCorrect]
            );
        }

        res.status(201).json({ message: 'Question created' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Delete All Questions (Admin)
router.delete('/delete-all', verifyAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM user_responses');
        await db.query('DELETE FROM quiz_sessions');
        await db.query('DELETE FROM options');
        await db.query('DELETE FROM questions');
        res.json({ message: 'All questions and related data deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Deletion failed');
    }
});

// Delete Single Question (Admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Delete options first (though not strictly required without FK constraints, good practice)
        await db.query('DELETE FROM options WHERE question_id = ?', [id]);

        // Delete related user responses? 
        // We have user_responses -> question_id.
        await db.query('DELETE FROM user_responses WHERE question_id = ?', [id]);

        await db.query('DELETE FROM questions WHERE id = ?', [id]);
        res.json({ message: 'Question deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Deletion failed');
    }
});

// Update Question (Admin)
router.put('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { categoryId, content, difficulty, points, options, correctOptionIndex } = req.body;
    // options: array of {id (optional), content}

    try {
        // Update Question
        await db.query(`
            UPDATE questions 
            SET category_id = ?, content = ?, difficulty = ?, points = ? 
            WHERE id = ?
        `, [categoryId, content, difficulty, points, id]);

        // Update Options
        // Let's fetch current options
        const curOpts = await db.query('SELECT id FROM options WHERE question_id = ?', [id]);
        const curOptIds = curOpts.rows.map(o => o.id);

        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            const isCorrect = (i === parseInt(correctOptionIndex));

            if (opt.id && curOptIds.includes(opt.id)) {
                // Update
                await db.query('UPDATE options SET content = ?, is_correct = ? WHERE id = ?', [opt.content, isCorrect, opt.id]);
                // Remove from curOptIds list to track what's left
                const idx = curOptIds.indexOf(opt.id);
                if (idx > -1) curOptIds.splice(idx, 1);
            } else {
                // Insert New
                await db.query('INSERT INTO options (question_id, content, is_correct) VALUES (?, ?, ?)', [id, opt.content, isCorrect]);
            }
        }

        // Delete remaining options (removed by user)
        for (const remId of curOptIds) {
            await db.query('DELETE FROM options WHERE id = ?', [remId]);
        }

        res.json({ message: 'Question updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Update failed');
    }
});

// Get Questions with Options & Status (Kanban View)
router.get('/', async (req, res) => {
    try {
        // We need: q.id, q.content, q.points, q.difficulty, q.category_id, cat.name
        // AND user_status: 'UNANSWERED', 'CORRECT', 'INCORRECT'

        // Check Authorization header manually here? Or better, use verifyToken middleware.
        // It's likely this endpoint was public before. Now it MUST be protected to show status.
        // Let's assume frontend sends token. If not, just return questions without status?
        // User requested "users should able to take...". Implies logged in.

        let userId = null;
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            if (token) {
                try {
                    const jwt = require('jsonwebtoken'); // Lazy load
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    userId = decoded.id;
                } catch (e) {/* ignore invalid token */ }
            }
        }

        const qRes = await db.query(`
            SELECT q.*, c.name as category_name 
            FROM questions q
            LEFT JOIN categories c ON q.category_id = c.id
            ORDER BY RANDOM()
        `);
        const questions = qRes.rows;

        // Fetch options
        if (questions.length === 0) return res.json([]);
        const qIds = questions.map(q => q.id).join(',');
        const oRes = await db.query(`SELECT * FROM options WHERE question_id IN (${qIds}) ORDER BY RANDOM()`);
        const options = oRes.rows;

        // Fetch User Responses if logged in
        let userResponses = [];
        if (userId) {
            // We need to fetch responses linked to this user.
            // Current schema: user_responses -> quiz_sessions -> users
            // We need all responses for this user across ANY session (or specifically a "Kanban" session).
            // Let's just JOIN sessions.
            const urRes = await db.query(`
                SELECT ur.question_id, ur.is_correct 
                FROM user_responses ur
                JOIN quiz_sessions qs ON ur.session_id = qs.id
                WHERE qs.user_id = ?
            `, [userId]);
            userResponses = urRes.rows;
        }

        const result = questions.map(q => {
            const myResponse = userResponses.find(ur => ur.question_id === q.id);
            let status = 'UNANSWERED';
            if (myResponse) {
                status = myResponse.is_correct ? 'CORRECT' : 'INCORRECT';
            }

            return {
                ...q,
                category: q.category_name,
                options: options.filter(o => o.question_id === q.id).map(o => ({ id: o.id, content: o.content })),
                status
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
