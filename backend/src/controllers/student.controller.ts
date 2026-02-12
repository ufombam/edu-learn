import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // 1. Fetch Enrolled Courses
        const coursesResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.thumbnail_url,
        e.enrolled_at as last_accessed_at,
        (
          SELECT COALESCE(ROUND(COUNT(lp.id)::numeric / NULLIF(COUNT(l.id), 0) * 100), 0)
          FROM lessons l
          LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = $1 AND lp.is_completed = true
          WHERE l.course_id = c.id
        ) as progress_percentage
      FROM course_enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
      LIMIT 5
    `, [userId]);

        // 2. Fetch Upcoming Sessions
        const sessionsResult = await pool.query(`
      SELECT 
        s.id,
        s.scheduled_at,
        s.duration_minutes,
        s.session_type,
        p.full_name as mentor_name
      FROM mentor_sessions s
      JOIN public.profiles p ON p.id = s.mentor_id
      WHERE s.student_id = $1 AND s.scheduled_at > NOW() AND s.status != 'cancelled'
      ORDER BY s.scheduled_at ASC
      LIMIT 3
    `, [userId]);

        // 3. Stats
        const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM course_enrollments WHERE student_id = $1) as total_courses,
        (
          SELECT COUNT(*)
          FROM (
            SELECT e.course_id
            FROM course_enrollments e
            JOIN lessons l ON l.course_id = e.course_id
            LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = $1 AND lp.is_completed = true
            WHERE e.student_id = $1
            GROUP BY e.course_id
            HAVING COUNT(lp.id) = COUNT(l.id) AND COUNT(l.id) > 0
          ) as completed
        ) as completed_courses,
        (SELECT COALESCE(SUM(time_spent_minutes), 0) / 60 FROM lesson_progress WHERE student_id = $1) as total_hours
    `, [userId]);

        const statsRow = statsResult.rows[0];

        res.json({
            enrolledCourses: coursesResult.rows,
            upcomingSessions: sessionsResult.rows,
            stats: {
                totalCourses: Number(statsRow.total_courses),
                completedCourses: Number(statsRow.completed_courses),
                totalHours: Math.round(Number(statsRow.total_hours)),
                currentStreak: 7 // Static for now as schema doesn't support it easily
            }
        });
    } catch (err) {
        console.error('Error fetching student dashboard:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
