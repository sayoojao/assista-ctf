const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../_MConverter.eu_odoo_quiz_csv.csv');

async function seed() {
    console.log('Starting seed from:', CSV_FILE);
    const results = [];

    fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let count = 0;
            for (const row of results) {
                try {
                    // 1. Category
                    const catName = row.Category.trim();
                    let catId;
                    const catRes = await db.query('SELECT id FROM categories WHERE name = ?', [catName]);
                    if (catRes.rows.length > 0) {
                        catId = catRes.rows[0].id;
                    } else {
                        await db.query('INSERT INTO categories (name) VALUES (?)', [catName]);
                        const newCat = await db.query('SELECT id FROM categories WHERE name = ?', [catName]);
                        catId = newCat.rows[0].id;
                    }

                    // 2. Question
                    await db.query(
                        'INSERT INTO questions (category_id, content, difficulty, points) VALUES (?, ?, ?, ?)',
                        [catId, row.Content, row.Difficulty, row.Points]
                    );

                    // Get ID
                    const qRes = await db.query('SELECT id FROM questions WHERE content = ? ORDER BY id DESC LIMIT 1', [row.Content]);
                    const qId = qRes.rows[0].id;

                    // 3. Options
                    const rawOptions = row.Options.split('|');
                    const correctLetter = row.CorrectOption.trim().toUpperCase(); // A, B, C, D

                    const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                    const correctIdx = letterMap[correctLetter];

                    for (let i = 0; i < rawOptions.length; i++) {
                        const optText = rawOptions[i].trim();
                        const isCorrect = (i === correctIdx);
                        await db.query('INSERT INTO options (question_id, content, is_correct) VALUES (?, ?, ?)', [qId, optText, isCorrect]);
                    }
                    count++;
                } catch (err) {
                    console.error('Failed row:', row.Content, err);
                }
            }
            console.log(`Imported ${count} questions.`);
        });
}

seed();
