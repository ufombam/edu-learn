import { pool } from '../db';

export async function getUserProfile(userId: string) {
    const result = await pool.query(
        `SELECT 
      u.id,
      u.email,
      p.full_name,
      p.role,
      p.bio,
      p.phone_number,
      p.language_preference,
      p.low_bandwidth_mode,
      p.created_at,
      p.updated_at
     FROM auth.users u
     LEFT JOIN public.profiles p ON u.id = p.id
     WHERE u.id = $1`,
        [userId]
    );

    if (!result.rows.length) {
        throw new Error('User not found');
    }

    return result.rows[0];
}

export async function updateUserProfile(userId: string, updates: {
    full_name?: string;
    bio?: string;
    phone_number?: string;
    language_preference?: string;
    low_bandwidth_mode?: boolean;
}) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.full_name !== undefined) {
        fields.push(`full_name = $${paramIndex++}`);
        values.push(updates.full_name);
    }
    if (updates.bio !== undefined) {
        fields.push(`bio = $${paramIndex++}`);
        values.push(updates.bio);
    }
    if (updates.phone_number !== undefined) {
        fields.push(`phone_number = $${paramIndex++}`);
        values.push(updates.phone_number);
    }
    if (updates.language_preference !== undefined) {
        fields.push(`language_preference = $${paramIndex++}`);
        values.push(updates.language_preference);
    }
    if (updates.low_bandwidth_mode !== undefined) {
        fields.push(`low_bandwidth_mode = $${paramIndex++}`);
        values.push(updates.low_bandwidth_mode);
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
    UPDATE public.profiles
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

    const result = await pool.query(query, values);
    return result.rows[0];
}
