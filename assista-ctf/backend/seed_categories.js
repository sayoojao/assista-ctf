const db = require('./db');

const categories = [
    'Python',
    'OWL',
    'Odoo Technical',
    'Odoo Functional',
    'SQL',
    'General'
];

async function seed() {
    console.log('Seeding categories...');
    for (const cat of categories) {
        try {
            await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [cat, `Questions related to ${cat}`]);
            console.log(`Added: ${cat}`);
        } catch (err) {
            if (err.message.includes('UNIQUE')) {
                console.log(`Skipped (Exists): ${cat}`);
            } else {
                console.error(`Error adding ${cat}:`, err);
            }
        }
    }
    console.log('Seeding complete.');
}

seed();
