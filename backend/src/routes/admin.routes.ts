import { Router } from 'express';
import {
    loadCourses,
    createCourse,
    publishCourse,
    deleteCourse,
    seedCourses,
    updateCourse,
    updateCourseLessons
} from '../courses/course.services';
import { requireAuth } from '../auth/auth.middleware';
import { pool } from '../db';

const router = Router();

// Stats route: GET /api/admin/stats
router.get("/stats", requireAuth, async (_req, res) => {
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

// Course management: GET /api/admin/courses
router.get('/courses', requireAuth, async (_req, res) => {
    try {
        const courses = await loadCourses();
        res.json(courses);
    } catch (err) {
        console.error('Error loading admin courses:', err);
        res.status(500).json({ message: 'Failed to load courses' });
    }
});

// Get all lessons (for topic dropdown): GET /api/admin/lessons/all
router.get('/lessons/all', requireAuth, async (_req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, title 
            FROM lessons 
            WHERE content_type != 'quiz'
            ORDER BY title ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error loading all lessons:', err);
        res.status(500).json({ message: 'Failed to load lessons' });
    }
});

// Create course: POST /api/admin/courses
router.post("/courses", requireAuth, async (req, res) => {
    try {
        console.log('[AdminRoute] Creating course:', req.body.title);
        const {
            title,
            description,
            category,
            difficulty_level,
            estimated_duration_hours,
            thumbnail_url
        } = req.body;

        const courseData = {
            title,
            description,
            category,
            difficulty_level,
            estimated_duration_hours,
            thumbnail_url
        };

        const data = await createCourse(courseData);
        res.status(201).json({ id: data[0].id });
    } catch (err: any) {
        console.error('[AdminRoute] Error creating course:', err);
        res.status(500).json({ message: err.message || 'Failed to create course' });
    }
});

// Publish course: PATCH /api/admin/courses/:id/publish
router.patch('/courses/:id/publish', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "ID is required" });
        const { is_published } = req.body;
        await publishCourse(id, is_published);
        res.json({ message: 'Course publication status updated' });
    } catch (err) {
        console.error('Error publishing course:', err);
        res.status(500).json({ message: 'Failed to update publication status' });
    }
});

// Delete course: DELETE /api/admin/courses/:id
router.delete('/courses/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "ID is required" });
        await deleteCourse(id);
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ message: 'Failed to delete course' });
    }
});

// Seed lessons: POST /api/admin/courses/:id/seed-lessons
router.post("/courses/:id/seed-lessons", requireAuth, async (req, res) => {
    try {
        const { lessons } = req.body;
        const courseId = req.params.id;
        if (!courseId) return res.status(400).json({ message: "Course ID is required" });

        await seedCourses(courseId, lessons);
        res.json({ success: true });
    } catch (err: any) {
        console.error('[AdminRoute] Error seeding lessons:', err);
        res.status(500).json({ message: err.message || 'Failed to seed lessons' });
    }
});

// Update course details: PUT /api/admin/courses/:id
router.put('/courses/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: 'Course ID is required' });
            return;
        }
        const updatedCourse = await updateCourse(id, req.body);
        res.json(updatedCourse);
    } catch (err: any) {
        console.error('Error updating course:', err);
        res.status(500).json({ message: 'Failed to update course' });
    }
});

// Update course lessons (replace all): PUT /api/admin/courses/:id/lessons
router.put('/courses/:id/lessons', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: 'Course ID is required' });
            return;
        }
        const { lessons } = req.body;
        await updateCourseLessons(id, lessons);
        res.json({ success: true });
    } catch (err: any) {
        console.error('Error updating lessons:', err);
        res.status(500).json({ message: 'Failed to update lessons' });
    }
});

// User Management: GET /api/admin/users
router.get('/users', requireAuth, async (req, res) => {
    try {
        const search = req.query.search as string || '';

        let query = `
            SELECT p.id, u.email, p.full_name, p.role, p.created_at
            FROM profiles p
            JOIN auth.users u ON p.id = u.id
            ORDER BY p.created_at DESC
        `;

        let params: any[] = [];

        if (search) {
            query = `
                SELECT p.id, u.email, p.full_name, p.role, p.created_at
                FROM profiles p
                JOIN auth.users u ON p.id = u.id
                WHERE p.full_name ILIKE $1 OR u.email ILIKE $1
                ORDER BY p.created_at DESC
            `;
            params = [`%${search}%`];
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error loading users:', err);
        res.status(500).json({ message: 'Failed to load users' });
    }
});

// Update user role: PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!['student', 'mentor', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const { rows } = await pool.query(
            'UPDATE profiles SET role = $1 WHERE id = $2 RETURNING id, full_name, role',
            [role, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ message: 'Failed to update user role' });
    }
});

// Delete user: DELETE /api/admin/users/:id
router.delete('/users/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Delete user (cascade will handle related records)
        const { rowCount } = await pool.query('DELETE FROM profiles WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

export default router;
