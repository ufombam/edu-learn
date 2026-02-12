import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
    host: process.env.PROJ_DB_HOST,
    user: process.env.PROJ_DB_USER,
    password: process.env.PROJ_DB_PASSWORD,
    database: process.env.PROJ_DB_NAME,
    port: parseInt(process.env.PROJ_DB_PORT || '5432'),
});

async function inspectTable() {
    try {
        console.log('Inspecting courses table...');
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'courses'
            ORDER BY ordinal_position
        `);
        console.log('Columns:');
        result.rows.forEach(r => {
            console.log(` - ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable})`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspectTable();
