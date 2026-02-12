import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// Get quiz and questions for a lesson
router.get('/:lessonId', requireAuth, async (req, res) => {
    try {
        const { lessonId } = req.params;

        const quizResult = await pool.query(
            'SELECT * FROM quizzes WHERE lesson_id = $1',
            [lessonId]
        );

        if (quizResult.rowCount === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const quiz = quizResult.rows[0];

        const questionsResult = await pool.query(
            'SELECT id, question_text, question_type, options, points, order_index, topic FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC',
            [quiz.id]
        );

        res.json({
            ...quiz,
            questions: questionsResult.rows
        });
    } catch (err) {
        console.error('Error fetching quiz:', err);
        res.status(500).json({ message: 'Failed to load quiz' });
    }
});

// Submit a quiz attempt
router.post('/:quizId/attempt', requireAuth, async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const studentId = (req as any).userId;

        // Fetch correct answers to calculate score
        const questionsResult = await pool.query(
            'SELECT id, correct_answer, points, topic FROM quiz_questions WHERE quiz_id = $1',
            [quizId]
        );

        const questions = questionsResult.rows;
        let score = 0;
        let maxScore = 0;

        const topicScores: Record<string, { total: number, earned: number }> = {};

        questions.forEach(q => {
            maxScore += q.points;

            // Initialize topic stats if topic exists
            if (q.topic) {
                if (!topicScores[q.topic]) {
                    topicScores[q.topic] = { total: 0, earned: 0 };
                }
                topicScores[q.topic]!.total += q.points;
            }

            if (answers[q.id] === q.correct_answer) {
                score += q.points;
                if (q.topic) {
                    // topicScores[q.topic] is guaranteed to exist because of the loop above? 
                    // No, the loop above initializes it for ALL questions that have a topic.
                    // THIS loop is the same loop. 
                    // So yes, it was initialized lines above.
                    topicScores[q.topic]!.earned += q.points;
                }
            }
        });

        // Determine weak topics (< 70%)
        const weakTopics: string[] = [];
        Object.entries(topicScores).forEach(([topic, stats]) => {
            const topicPercentage = stats.total > 0 ? (stats.earned / stats.total) * 100 : 0;
            if (topicPercentage < 70) {
                weakTopics.push(topic);
            }
        });


        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

        // Save attempt
        const attemptResult = await pool.query(
            `INSERT INTO quiz_attempts (student_id, quiz_id, score, answers, completed_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, score`,
            [studentId, quizId, Math.round(percentage), JSON.stringify(answers)]
        );

        // Mark lesson as completed if they pass? 
        // For now just return the result
        res.status(201).json({
            attemptId: attemptResult.rows[0].id,
            score: percentage,
            passed: percentage >= 70,
            weakTopics
        });

    } catch (err) {
        console.error('Error submitting quiz attempt:', err);
        res.status(500).json({ message: 'Failed to submit quiz' });
    }
});

export default router;
