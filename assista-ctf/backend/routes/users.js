const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyAdmin } = require('../middleware/auth');

// List All Users
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, role, created_at FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Create User (Admin Only)
router.post('/', verifyAdmin, async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).send('Missing fields');

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'USER']
        );
        res.status(201).send('User created');
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).send('Username/Email exists');
        }
        res.status(500).send('Server error');
    }
});

// Update User
router.put('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, email, role, password } = req.body; // Optional password update

    try {
        let query = 'UPDATE users SET username = ?, email = ?, role = ?';
        let params = [username, email, role];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password_hash = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        res.send('User updated');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Delete User
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    // Prevent deleting self? Usually good practice, but assume frontend handles generic warning.
    // Actually, backend should block deleting the last admin or self.
    // For now, let's just allow it for simplicity as requested, but maybe add a check if it's the requested user?
    if (req.user.id == id) {
        return res.status(400).send('Cannot delete yourself');
    }

    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.send('User deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
