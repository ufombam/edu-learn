import { Router, Request, Response } from 'express';
import { getUserProfile, updateUserProfile } from './profile.service';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// GET /api/profile/me - Get current user's profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const profile = await getUserProfile(userId);
        console.log(`[ProfileRoute] Fetched profile for ${userId}:`, profile);
        res.json(profile);
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch profile' });
    }
});

// PUT /api/profile - Update current user's profile
router.put('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const updates = req.body;

        const updatedProfile = await updateUserProfile(userId, updates);
        res.json(updatedProfile);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: error.message || 'Failed to update profile' });
    }
});

export default router;
