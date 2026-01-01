const db = require('./db');

async function clearData() {
    console.log('Clearing questions data...');
    try {
        await db.query('DELETE FROM user_responses');
        await db.query('DELETE FROM quiz_sessions');
        await db.query('DELETE FROM options');
        await db.query('DELETE FROM questions');
        console.log('Data cleared.');
    } catch (err) {
        console.error('Error clearing data:', err);
    }
}

clearData();
