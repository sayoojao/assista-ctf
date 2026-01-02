const fs = require('fs');
const path = require('path');
const db = require('./db');

const schemaPath = path.resolve(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// SQLite doesn't support running multiple statements in one call easily with basic driver if not configured.
// We'll split by semi-colon.
const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

async function init() {
    console.log('Initializing database...');
    for (const stmt of statements) {
        try {
            await db.query(stmt);
        } catch (err) {
            console.error('Error executing statement:', stmt, err);
        }
    }
    console.log('Database initialized.');
    // Close the database connection properly
    db.db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        }
        process.exit(0);
    });
}

init();
