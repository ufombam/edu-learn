import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
    host: process.env.PROJ_DB_HOST,
    user: process.env.PROJ_DB_USER,
    password: process.env.PROJ_DB_PASSWORD,
    database: process.env.PROJ_DB_NAME,
    port: parseInt(process.env.PROJ_DB_PORT || '5432'),
});

async function run() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'courses'
            ORDER BY ordinal_position
        `);
        let output = 'Courses Table Structure:\n';
        result.rows.forEach(r => {
            output += ` - ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable})\n`;
        });
        fs.writeFileSync('courses_structure.txt', output);
        process.exit(0);
    } catch (err: any) {
        fs.writeFileSync('courses_structure.txt', 'Error: ' + err.message);
        process.exit(1);
    }
}

run();
