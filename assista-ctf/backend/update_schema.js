const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'quiz.db');
const db = new sqlite3.Database(dbPath);

const createTableQuery = `
CREATE TABLE IF NOT EXISTS quiz_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_active BOOLEAN DEFAULT 0,
  start_time TIMESTAMP,
  duration_minutes INTEGER DEFAULT 0
);
`;

db.run(createTableQuery, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Table quiz_settings created successfully.');
    }
    db.close();
});
