
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function fixSpecific() {
    try {
        console.log('Fixing test user...');

        const res = await pool.query(`
            UPDATE public.profiles p
            SET full_name = 'Test Student', role = 'student'
            FROM auth.users u
            WHERE p.id = u.id AND (u.email LIKE 'test%')
        `);

        console.log(`Updated ${res.rowCount} rows.`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

fixSpecific();
