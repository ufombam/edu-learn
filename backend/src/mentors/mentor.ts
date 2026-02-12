import { Request, Response } from 'express';
import { pool } from '../db';

export const getAvailableMentors = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        mp.id,
        mp.specializations,
        mp.bio,
        mp.rating_average,
        mp.total_sessions,
        mp.is_available,
        mp.hourly_rate,
        p.full_name,
        p.avatar_url
      FROM mentor_profiles mp
      JOIN profiles p ON p.id = mp.id
      WHERE mp.is_available = true
      ORDER BY mp.rating_average DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('Error loading mentors:', err);
    res.status(500).json({ message: 'Failed to load mentors' });
  }
};

export const getMentorProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { rows } = await pool.query(
      `
      SELECT
        mp.id,
        mp.specializations,
        mp.bio,
        mp.rating_average,
        mp.total_sessions,
        mp.is_available,
        mp.hourly_rate,
        p.full_name,
        p.avatar_url
      FROM mentor_profiles mp
      JOIN profiles p ON p.id = mp.id
      WHERE mp.id = $1
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error loading mentor profile:', err);
    res.status(500).json({ message: 'Failed to load mentor profile' });
  }
};

export const updateMentorProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { bio, specializations, is_available, hourly_rate } = req.body;

    // Check if mentor profile exists
    const checkResult = await pool.query(
      'SELECT id FROM mentor_profiles WHERE id = $1',
      [userId]
    );

    if (checkResult.rows.length === 0) {
      // Create new mentor profile
      await pool.query(
        `INSERT INTO mentor_profiles (id, bio, specializations, is_available, hourly_rate, rating_average, total_sessions)
         VALUES ($1, $2, $3, $4, $5, 0, 0)`,
        [userId, bio, specializations, is_available, hourly_rate]
      );
    } else {
      // Update existing mentor profile
      await pool.query(
        `UPDATE mentor_profiles
         SET bio = $2, specializations = $3, is_available = $4, hourly_rate = $5, updated_at = NOW()
         WHERE id = $1`,
        [userId, bio, specializations, is_available, hourly_rate]
      );
    }

    // Also update the bio in the profiles table
    await pool.query(
      'UPDATE profiles SET bio = $2, updated_at = NOW() WHERE id = $1',
      [userId, bio]
    );

    res.json({ message: 'Mentor profile updated successfully' });
  } catch (err) {
    console.error('Error updating mentor profile:', err);
    res.status(500).json({ message: 'Failed to update mentor profile' });
  }
};
