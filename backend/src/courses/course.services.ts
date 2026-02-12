import { AuthRequest } from '../auth/auth.middleware';
import { Response } from 'express';
import { pool } from '../db';

const loadCourses = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM courses ORDER BY created_at DESC`
  );
  return rows;
}

const publishCourse = async (courseId: string, isPublished: boolean) => {
  await pool.query(
    `UPDATE courses SET is_published = $1 WHERE id = $2`,
    [isPublished, courseId]
  );
}

const deleteCourse = async (courseId: string) => {
  await pool.query(
    `DELETE FROM courses WHERE id = $1`,
    [courseId]
  );
}

const seedCourses = async (courseId: string, lessons: any[]) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      const lessonResult = await client.query(
        `INSERT INTO lessons (
          course_id, title, description, content_type,
          content_url, content_text, duration_minutes,
          is_downloadable, order_index
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id`,
        [
          courseId,
          l.title,
          l.description,
          l.contentType,
          l.contentUrl || null,
          l.contentText || null,
          l.duration,
          l.saveForOffline,
          i
        ]
      );

      const lessonIdToken = lessonResult.rows[0].id;

      // Handle Quiz
      if (l.contentType === 'quiz' && l.quizData) {
        const quizResult = await client.query(
          `INSERT INTO quizzes (lesson_id, title, passing_score, time_limit_minutes)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [lessonIdToken, l.quizData.title || l.title, l.quizData.passingScore || 70, l.quizData.timeLimit || null]
        );

        const quizId = quizResult.rows[0].id;

        if (l.quizData.questions && l.quizData.questions.length > 0) {
          for (let j = 0; j < l.quizData.questions.length; j++) {
            const q = l.quizData.questions[j];
            await client.query(
              `INSERT INTO quiz_questions (
                quiz_id, question_text, question_type, 
                options, correct_answer, points, order_index, topic
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                quizId,
                q.question_text,
                q.question_type,
                JSON.stringify(q.options),
                q.correct_answer,
                q.points || 1,
                j,
                q.topic || null
              ]
            );
          }
        }
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const createCourse = async (courseData: any) => {
  console.log('[CourseService] createCourse called with:', courseData);
  const { rows } = await pool.query(
    `INSERT INTO courses (
          title, description, category, difficulty_level,
          estimated_duration_hours, thumbnail_url,
          is_published
        )
        VALUES ($1,$2,$3,$4,$5,$6,false)
        RETURNING id`,
    [
      courseData.title,
      courseData.description,
      courseData.category,
      courseData.difficulty_level,
      courseData.estimated_duration_hours,
      courseData.thumbnail_url
    ]
  );
  return rows
}

const getCourseCatalog = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await pool.query(`
    SELECT
      c.id,
      c.title,
      c.description,
      c.thumbnail_url,
      c.category,
      c.difficulty_level,
      c.estimated_duration_hours,
      EXISTS (
        SELECT 1
        FROM course_enrollments e
        WHERE e.course_id = c.id
          AND e.student_id = $1
      ) AS is_enrolled
    FROM courses c
    WHERE c.is_published = true
    ORDER BY c.created_at DESC
  `, [req.userId]);

  res.json(result.rows);
};

const enrollInCourse = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  await pool.query(`
    INSERT INTO course_enrollments (student_id, course_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [req.userId, id]);

  res.status(201).json({ success: true });
};

const getCourseDetails = async (req: AuthRequest, res: Response) => {
  const { id: courseId } = req.params;
  const studentId = req.userId!;

  try {
    /* Get course */
    const courseResult = await pool.query(
      `SELECT * FROM courses WHERE id = $1`,
      [courseId]
    );

    if (courseResult.rowCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = courseResult.rows[0];

    /* Get lessons */
    const lessonsResult = await pool.query(
      `
      SELECT *
      FROM lessons
      WHERE course_id = $1
      ORDER BY order_index ASC
      `,
      [courseId]
    );

    const lessons = lessonsResult.rows;

    /* Get lesson progress */
    let completedIds = new Set<string>();

    if (lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);

      const progressResult = await pool.query(
        `
        SELECT lesson_id, is_completed
        FROM lesson_progress
        WHERE student_id = $1
          AND lesson_id = ANY($2::uuid[])
        `,
        [studentId, lessonIds]
      );

      progressResult.rows.forEach(row => {
        if (row.is_completed) {
          completedIds.add(row.lesson_id);
        }
      });
    }

    const lessonsWithProgress = lessons.map(lesson => ({
      ...lesson,
      is_completed: completedIds.has(lesson.id)
    }));

    const progress =
      lessons.length > 0
        ? Math.round((completedIds.size / lessons.length) * 100)
        : 0;

    /* Auto-enroll student if not enrolled */
    const enrollmentResult = await pool.query(
      `
      SELECT 1
      FROM course_enrollments
      WHERE student_id = $1 AND course_id = $2
      `,
      [studentId, courseId]
    );

    if (enrollmentResult.rowCount === 0) {
      await pool.query(
        `
        INSERT INTO course_enrollments (student_id, course_id)
        VALUES ($1, $2)
        `,
        [studentId, courseId]
      );
    }

    return res.json({
      course,
      lessons: lessonsWithProgress,
      progress
    });

  } catch (error) {
    console.error("Error loading course details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getLesson = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const studentId = req.userId!;

  try {
    /* Load lesson */
    const lessonResult = await pool.query(
      `SELECT * FROM lessons WHERE id = $1`,
      [lessonId]
    );

    if (lessonResult.rowCount === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const lesson = lessonResult.rows[0];

    /* Get next lesson */
    const nextLessonResult = await pool.query(
      `
      SELECT id
      FROM lessons
      WHERE course_id = $1
        AND order_index > $2
      ORDER BY order_index ASC
      LIMIT 1
      `,
      [lesson.course_id, lesson.order_index]
    );

    const nextLessonId =
      (nextLessonResult.rowCount ?? 0) > 0
        ? nextLessonResult.rows[0].id
        : null;

    /* Get lesson progress */
    const progressResult = await pool.query(
      `
      SELECT is_completed
      FROM lesson_progress
      WHERE student_id = $1 AND lesson_id = $2
      `,
      [studentId, lessonId]
    );

    const isCompleted =
      (progressResult.rowCount ?? 0) > 0
        ? progressResult.rows[0].is_completed
        : false;

    /* Upsert last accessed */
    await pool.query(
      `
      INSERT INTO lesson_progress (
        student_id,
        lesson_id,
        last_accessed_at
      )
      VALUES ($1, $2, NOW())
      ON CONFLICT (student_id, lesson_id)
      DO UPDATE SET last_accessed_at = NOW()
      `,
      [studentId, lessonId]
    );

    /* Response */
    return res.json({
      lesson,
      isCompleted,
      nextLessonId
    });

  } catch (error) {
    console.error("Error loading lesson:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const markLessonComplete = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const studentId = req.userId!;

  try {
    await pool.query(
      `
      INSERT INTO lesson_progress (
        student_id,
        lesson_id,
        is_completed,
        completed_at
      )
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (student_id, lesson_id)
      DO UPDATE SET
        is_completed = true,
        completed_at = NOW()
      `,
      [studentId, lessonId]
    );

    return res.json({ success: true });

  } catch (error) {
    console.error("Error marking lesson complete:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getMentorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT bio, specializations, is_available, hourly_rate
       FROM mentor_profiles
       WHERE id = $1`,
      [req.userId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load mentor profile' });
  }
};

const updateMentorProfile = async (req: AuthRequest, res: Response) => {
  const { bio, specializations, isAvailable, hourlyRate } = req.body;

  try {
    await pool.query(
      `UPDATE mentor_profiles
       SET bio = $1,
           specializations = $2,
           is_available = $3,
           hourly_rate = $4
       WHERE id = $5`,
      [
        bio,
        specializations,
        isAvailable,
        hourlyRate ?? null,
        req.userId
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update mentor profile' });
  }
};

const getLessonsByTopic = async (req: AuthRequest, res: Response) => {
  try {
    const { topic } = req.query;
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const result = await pool.query(`
            SELECT 
                l.id, l.title, l.description, c.title as course_title, c.id as course_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            JOIN quizzes q ON q.lesson_id = l.id
            JOIN quiz_questions qq ON qq.quiz_id = q.id
            WHERE qq.topic = $1
            LIMIT 5
        `, [topic]);

    // If no lessons found by quiz topic directly, try searching lesson descriptions/titles
    if (result.rows.length === 0) {
      const fuzzyResult = await pool.query(`
                SELECT 
                    l.id, l.title, l.description, c.title as course_title, c.id as course_id
                FROM lessons l
                JOIN courses c ON l.course_id = c.id
                WHERE l.title ILIKE $1 OR l.description ILIKE $1
                LIMIT 5
            `, [`%${topic}%`]);
      return res.json(fuzzyResult.rows);
    }

    // Deduplicate lessons
    const uniqueLessons = Array.from(new Map(result.rows.map(item => [item['id'], item])).values());

    res.json(uniqueLessons);
  } catch (err) {
    console.error('Error getting lessons by topic:', err);
    res.status(500).json({ message: 'Failed to fetch recommended lessons' });
  }
};




const updateCourse = async (courseId: string, courseData: any) => {
  const { rows } = await pool.query(
    `UPDATE courses 
     SET title = $1, description = $2, category = $3, difficulty_level = $4,
         estimated_duration_hours = $5, thumbnail_url = $6
     WHERE id = $7
     RETURNING *`,
    [
      courseData.title,
      courseData.description,
      courseData.category,
      courseData.difficulty_level,
      courseData.estimated_duration_hours,
      courseData.thumbnail_url,
      courseId
    ]
  );
  return rows[0];
};

const updateCourseLessons = async (courseId: string, lessons: any[]) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Delete existing lessons (cascade will handle quizzes/questions/progress)
    // Note: This wipes progress! In a real app we might want to be smarter, 
    // but for this MVP asking to "edit" usually implies structure changes.
    // If we want to preserve progress for unchanged lessons, we'd need complex diffing.
    // optimize: only delete lessons that are missing from new list? 
    // For now, simpler to wipe and recreate to ensure order and consistency.
    await client.query(`DELETE FROM lessons WHERE course_id = $1`, [courseId]);

    // 2. Re-insert using the same logic as seedCourses
    // We can't reuse seedCourses directly because it manages its own transaction and creates client.
    // So we copy the logic here using the shared client.

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      const lessonResult = await client.query(
        `INSERT INTO lessons (
            course_id, title, description, content_type,
            content_url, content_text, duration_minutes,
            is_downloadable, order_index
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          RETURNING id`,
        [
          courseId,
          l.title,
          l.description,
          l.contentType,
          l.contentUrl || null,
          l.contentText || null,
          l.duration,
          l.saveForOffline,
          i
        ]
      );

      const lessonIdToken = lessonResult.rows[0].id;

      // Handle Quiz
      if (l.contentType === 'quiz' && l.quizData) {
        const quizResult = await client.query(
          `INSERT INTO quizzes (lesson_id, title, passing_score, time_limit_minutes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [lessonIdToken, l.quizData.title || l.title, l.quizData.passingScore || 70, l.quizData.timeLimit || null]
        );

        const quizId = quizResult.rows[0].id;

        if (l.quizData.questions && l.quizData.questions.length > 0) {
          for (let j = 0; j < l.quizData.questions.length; j++) {
            const q = l.quizData.questions[j];
            await client.query(
              `INSERT INTO quiz_questions (
                  quiz_id, question_text, question_type, 
                  options, correct_answer, points, order_index, topic
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                quizId,
                q.question_text,
                q.question_type,
                JSON.stringify(q.options),
                q.correct_answer,
                q.points || 1,
                j,
                q.topic || null
              ]
            );
          }
        }
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export {
  loadCourses,
  publishCourse,
  deleteCourse,
  seedCourses,
  createCourse,
  updateCourse,
  updateCourseLessons,
  getCourseCatalog,
  enrollInCourse,
  getCourseDetails,
  getLesson,
  markLessonComplete,
  getMentorProfile,
  updateMentorProfile,
  getLessonsByTopic
};