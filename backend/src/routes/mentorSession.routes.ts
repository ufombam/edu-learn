import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { bookMentorSession, confirmSession, rescheduleSession } from '../mentors/mentorSession';

const router = Router();

router.post('/', requireAuth, bookMentorSession);
router.put('/confirm/:id', requireAuth, confirmSession);
router.put('/reschedule/:id', requireAuth, rescheduleSession);

export default router;
