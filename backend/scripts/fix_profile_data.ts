
import path from 'path';
import dotenv from 'dotenv';

async function fix() {
    // 1. Load env vars BEFORE importing db
    const envPath = path.resolve(__dirname, '..', '.env');
    console.log('Loading .env from:', envPath);
    dotenv.config({ path: envPath });

    // 2. Dynamic import to ensure process.env is populated
    const { pool } = await import('../src/db.js');

    try {
        console.log('Running SQL fix...');

        // 1. Insert missing profiles
        const res1 = await pool.query(`
            INSERT INTO public.profiles (id, full_name, role)
            SELECT 
                id, 
                INITCAP(SPLIT_PART(email, '@', 1)), 
                'student'
            FROM auth.users
            WHERE id NOT IN (SELECT id FROM public.profiles)
            ON CONFLICT (id) DO NOTHING
        `);
        console.log(`Inserted ${res1.rowCount} missing profiles.`);

        // 2. Update existing profiles with null names
        const res2 = await pool.query(`
            UPDATE public.profiles p
            SET full_name = INITCAP(SPLIT_PART(u.email, '@', 1))
            FROM auth.users u
            WHERE p.id = u.id AND (p.full_name IS NULL OR p.full_name = '')
        `);
        console.log(`Updated ${res2.rowCount} profiles with null names.`);

        // 3. Update existing profiles with null roles
        const res3 = await pool.query(`
             UPDATE public.profiles
             SET role = 'student'
             WHERE role IS NULL
        `);
        console.log(`Updated ${res3.rowCount} profiles with null roles.`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

fix();
