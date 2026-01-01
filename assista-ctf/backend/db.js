const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'quiz.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

module.exports = {
    query: (text, params) => {
        return new Promise((resolve, reject) => {
            // Simple heuristic to detect SELECT queries for db.all, others for db.run
            // Note: This is a basic wrapper. For production, consider a better query builder or ORM.
            const method = text.trim().toUpperCase().startsWith('SELECT') ? 'all' : 'run';

            db[method](text, params, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    // For run(), 'this' contains changes, lastID, etc.
                    // For all(), rows is the result
                    resolve(method === 'run' ? { ...this, rows: [] } : { rows });
                }
            });
        });
    },
    db // expose raw instance if needed
};
