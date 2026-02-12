
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function addTopic() {
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
            console.log("Column added.");
        } else {
            console.log("Column 'topic' already exists.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

addTopic();
