
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PROJ_DB_HOST || 'localhost',
    port: parseInt(process.env.PROJ_DB_PORT || '5432'),
    user: process.env.PROJ_DB_USER || 'postgres',
    password: process.env.PROJ_DB_PASSWORD || 'postgres',
    database: process.env.PROJ_DB_NAME || 'edu_learn'
});

async function check() {
    try {
        const res = await pool.query(`
      SELECT u.email, p.full_name, p.role 
      FROM auth.users u 
      LEFT JOIN public.profiles p ON u.id = p.id
    `);
        console.log('Rows:', res.rows);
    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}

check();
