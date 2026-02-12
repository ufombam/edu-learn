import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get("/admin/stats", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM profiles) AS total_users,
        (SELECT COUNT(*) FROM courses) AS total_courses,
        (SELECT COUNT(*) FROM course_enrollments) AS total_enrollments,
        (SELECT COUNT(*) FROM mentor_sessions) AS total_sessions
    `);

    const row = rows[0];

    res.json({
      totalUsers: Number(row.total_users),
      totalCourses: Number(row.total_courses),
      totalEnrollments: Number(row.total_enrollments),
      totalSessions: Number(row.total_sessions)
    });
  } catch (err) {
    console.error("Stats query failed:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

export default router;