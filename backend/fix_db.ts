import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function fixDatabase() {
    try {
        console.log('Fixing database schema...');

        // 1. Fix content_type enum
        const ctResult = await pool.query(`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'content_type' AND enumlabel = 'quiz'
        `);
        if (ctResult.rowCount === 0) {
            console.log("Adding 'quiz' to content_type enum...");
            await pool.query("ALTER TYPE content_type ADD VALUE 'quiz'");
        }

        // 2. Fix question_type enum
        const qtResult = await pool.query(`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'question_type' AND enumlabel = 'short_answer'
        `);
        if (qtResult.rowCount === 0) {
            console.log("Adding 'short_answer' to question_type enum...");
            await pool.query("ALTER TYPE question_type ADD VALUE 'short_answer'");
        }

        // 3. Create missing tables
        console.log('Recreating tables to be sure...');
        await pool.query(`
            DROP TABLE IF EXISTS quiz_attempts CASCADE;
            DROP TABLE IF EXISTS quiz_questions CASCADE;
            DROP TABLE IF EXISTS quizzes CASCADE;

            CREATE TABLE quizzes (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                title text NOT NULL,
                passing_score integer DEFAULT 70,
                time_limit_minutes integer,
                created_at timestamptz DEFAULT now()
            );

            CREATE TABLE quiz_questions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                question_text text NOT NULL,
                question_type question_type NOT NULL,
                topic text,
                options jsonb,
                correct_answer text NOT NULL,
                points integer DEFAULT 1,
                order_index integer NOT NULL DEFAULT 0
            );
        `);

        // 4. Add topic column if it doesn't exist (for existing tables)
        const topicResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='quiz_questions' AND column_name='topic'
        `);

        if (topicResult.rowCount === 0) {
            console.log("Adding 'topic' column to quiz_questions...");
            await pool.query("ALTER TABLE quiz_questions ADD COLUMN topic text");
        }

        await pool.query(`
            CREATE TABLE quiz_attempts (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                score integer DEFAULT 0,
                answers jsonb,
                started_at timestamptz DEFAULT now(),
                completed_at timestamptz,
                is_synced boolean DEFAULT true
            );
        `);

        console.log('Database fix complete.');
    } catch (err: any) {
        console.error('Error fixing database:', err.message);
    } finally {
        await pool.end();
    }
}

fixDatabase();
