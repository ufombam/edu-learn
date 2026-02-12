
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function fixNames() {
    try {
        console.log('Fixing missing names...');

        // Find users with null full_name
        const res = await pool.query(`
            SELECT u.id, u.email 
            FROM auth.users u
            LEFT JOIN public.profiles p ON u.id = p.id
            WHERE p.full_name IS NULL OR p.role IS NULL
        `);

        console.log(`Found ${res.rowCount} users with missing profile data.`);

        for (const user of res.rows) {
            const nameFromEmail = user.email.split('@')[0].replace(/[._]/g, ' ');
            const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

            console.log(`Updating user ${user.email} -> Name: ${capitalized}`);

            // Upsert profile
            await pool.query(`
                INSERT INTO public.profiles (id, full_name, role)
                VALUES ($1, $2, 'student')
                ON CONFLICT (id) DO UPDATE SET
                full_name = COALESCE(public.profiles.full_name, $2),
                role = COALESCE(public.profiles.role, 'student')
            `, [user.id, capitalized]);
        }

        console.log('Done.');

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

fixNames();
