import { Router } from "express";
import {
  enrollInCourse,
  getCourseCatalog,
  getCourseDetails,
  getLesson,
  markLessonComplete,
  getMentorProfile,
  updateMentorProfile,
  getLessonsByTopic
} from "../courses/course.services";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

// Public/Student routes - mounted at /api/courses
router.get('/catalog', requireAuth, getCourseCatalog);
router.get('/me', requireAuth, getMentorProfile);
router.put('/me', requireAuth, updateMentorProfile);

router.get('/lessons/:lessonId', requireAuth, getLesson);
router.post('/lessons/:lessonId/complete', requireAuth, markLessonComplete);
router.get('/lessons', requireAuth, getLessonsByTopic);

router.post('/:id/enroll', requireAuth, enrollInCourse);
router.get('/:id', requireAuth, getCourseDetails);

export default router;