
import path from 'path';
import dotenv from 'dotenv';

async function fixSchema() {
    // 1. Load env vars BEFORE importing db
    const envPath = path.resolve(__dirname, '..', '.env');
    console.log('Loading .env from:', envPath);
    dotenv.config({ path: envPath });

    // 2. Dynamic import to ensure process.env is populated
    const { pool } = await import('../src/db.js');

    try {
        console.log("Checking quiz_questions table...");
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='quiz_questions' AND column_name='topic'
        `);

        if (res.rowCount === 0) {
            console.log("Adding 'topic' column...");
            await pool.query("ALTER TABLE quiz_questions ADD COLUMN topic text");
            console.log("Column 'topic' added successfully.");
        } else {
            console.log("Column 'topic' already exists.");
        }
    } catch (e) {
        console.error("Error fixing schema:", e);
    } finally {
        await pool.end();
    }
}

fixSchema();
