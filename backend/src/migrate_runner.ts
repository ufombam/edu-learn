import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('DB Config:', {
    host: process.env.PROJ_DB_HOST,
    user: process.env.PROJ_DB_USER,
    database: process.env.PROJ_DB_NAME,
    port: process.env.PROJ_DB_PORT
});

const pool = new Pool({
    host: process.env.PROJ_DB_HOST,
    user: process.env.PROJ_DB_USER,
    password: process.env.PROJ_DB_PASSWORD,
    database: process.env.PROJ_DB_NAME,
    port: parseInt(process.env.PROJ_DB_PORT || '5432'),
});

async function migrate() {
    try {
        const migrationPath = path.join(process.cwd(), 'scripts', 'migrate_sessions_chat.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
