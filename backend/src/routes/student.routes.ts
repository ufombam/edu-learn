import { Router } from 'express';
import { getStudentDashboard } from '../controllers/student.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.get('/dashboard', requireAuth, getStudentDashboard);

export default router;
