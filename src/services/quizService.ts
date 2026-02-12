import api from '../lib/api';
import { storeInIndexedDB, getAllFromIndexedDB, removeFromIndexedDB } from '../utils/offlineStorage';

export interface QuizAttempt {
    id?: number; // IndexedDB ID
    quizId: string;
    answers: Record<string, any>;
    studentId: string; // Ensure we track who submitted
    timestamp: string;
}

export const submitQuiz = async (quizAttempt: QuizAttempt) => {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            console.log('Online: Submitting quiz...', quizAttempt);
            await api.post('/quizzes/attempts', { data: quizAttempt }); // Adjusted endpoint to match usage
            return { success: true, mode: 'online' };
        } catch (error) {
            console.error('Submission failed, falling back to offline storage', error);
            // Fallback to offline if request fails even if navigator says online
            await storeInIndexedDB('pendingQuizAttempts', quizAttempt);
            return { success: true, mode: 'offline-fallback' };
        }
    } else {
        console.log('Offline: Storing quiz attempt...');
        await storeInIndexedDB('pendingQuizAttempts', quizAttempt);
        return { success: true, mode: 'offline' };
    }
};

export const syncPendingAttempts = async () => {
    if (!navigator.onLine) return;

    try {
        const pendingAttempts = await getAllFromIndexedDB('pendingQuizAttempts');

        if (pendingAttempts.length === 0) return;

        console.log(`Syncing ${pendingAttempts.length} pending quiz attempts...`);

        for (const attempt of pendingAttempts) {
            try {
                await api.post('/quizzes/attempts', { data: attempt });
                // If successful, remove from DB
                await removeFromIndexedDB('pendingQuizAttempts', attempt.id);
                console.log(`Synced attempt ${attempt.id}`);
            } catch (error) {
                console.error(`Failed to sync attempt ${attempt.id}`, error);
                // Keep in DB to retry later
            }
        }
    } catch (error) {
        console.error('Error during sync process:', error);
    }
};
