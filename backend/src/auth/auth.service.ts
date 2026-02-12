import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function register(email: string, password: string, fullName: string, role: string) {
  try {
    console.log('[AuthService] Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('[AuthService] Inserting into auth.users...');
    const userResult = await pool.query(
      `INSERT INTO auth.users (id, email, encrypted_password)
       VALUES (gen_random_uuid(), $1, $2)
       RETURNING id`,
      [email, passwordHash]
    );

    const userId = userResult.rows[0].id;

    console.log('[AuthService] Inserting into public.profiles...');
    await pool.query(
      `INSERT INTO public.profiles (id, full_name, role)
       VALUES ($1, $2, $3)`,
      [userId, fullName, role]
    );
    return userId;
  } catch (err) {
    console.error('[AuthService] Register failed:', err);
    throw err;
  }
}

export async function login(email: string, password: string) {
  try {
    console.log('[AuthService] Searching for user:', email);
    const result = await pool.query(
      `SELECT id, encrypted_password FROM auth.users WHERE email = $1`,
      [email]
    );

    if (!result.rows.length) {
      console.log('[AuthService] User not found:', email);
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.encrypted_password);

    if (!valid) {
      console.log('[AuthService] Invalid password for:', email);
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

    console.log('[AuthService] Login successful for:', email);
    return { token, userId: user.id };
  } catch (err) {
    console.error('[AuthService] Login failed:', err);
    throw err;
  }
}

export async function testDbConnection() {
  const result = await pool.query('SELECT NOW()');
  console.log('Database connected:', result.rows[0].now);
}

testDbConnection().catch((err) => {
  console.error('Database connection error:', err);
});;