import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function checkTables() {
    try {
        console.log('Checking tables...');
        const tables = ['quizzes', 'quiz_questions', 'quiz_attempts', 'lessons', 'courses'];
        for (const table of tables) {
            const result = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table]);
            console.log(`Table '${table}' exists:`, result.rows[0].exists);
        }

        const enums = ['content_type', 'question_type'];
        for (const enumName of enums) {
            const result = await pool.query(`
                SELECT enumlabel 
                FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = $1
            `, [enumName]);
            console.log(`Enum values for ${enumName}:`, result.rows.map(r => r.enumlabel));
        }

    } catch (err: any) {
        console.error('Error during diagnostics:', err.message);
    } finally {
        await pool.end();
    }
}

checkTables();
