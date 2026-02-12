import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../auth/auth.middleware';

const router = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT * FROM public.profiles WHERE id = $1`,
    [req.userId]
  );

  res.json(result.rows[0]);
});

export default router;
