import { Router } from 'express';
import { getAvailableMentors, getMentorProfile, updateMentorProfile } from '../mentors/mentor';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// Public route - get all available mentors
router.get('/', getAvailableMentors);

// Protected routes - mentor profile management
router.get('/profile', requireAuth, getMentorProfile);
router.put('/profile', requireAuth, updateMentorProfile);

export default router;
