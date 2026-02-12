import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function checkProfile() {
    try {
        const res = await pool.query(`
      SELECT u.id, u.email, p.full_name 
      FROM auth.users u 
      LEFT JOIN public.profiles p ON u.id = p.id
    `);
        console.log('User Profiles:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkProfile();
