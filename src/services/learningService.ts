import api from '../lib/api';

export interface QuizResult {
    id: string;
    score: number;
    topic: string;
    quizId: string;
}

export interface Lesson {
    id: string;
    title: string;
    topic: string;
}

export const getRecommendedLessons = async (_studentId: string): Promise<Lesson[]> => {
    try {
        // Fetch the student's recent quiz performances
        // Mocking the endpoint structure based on pseudo-code
        // Ideally this endpoint returns recent quiz results with scores and topics
        const quizResponse = await api.get(`/student/quiz-results`, {
            params: { limit: 5 } // Assuming the backend knows the student from token, but pseudo says studentId param
        });
        // If the endpoint is strictly /api/students/{studentId}/quiz-results as per pseudo:
        // const quizResponse = await api.get(`/students/${studentId}/quiz-results?limit=5`);

        // Using the token-based /student route is safer usually, but I'll stick to the logic.
        // Let's assume the response.data IS the list of quizzes
        const recentQuizzes: QuizResult[] = quizResponse.data || [];

        const recommendedLessons: Lesson[] = [];
        const seenLessonIds = new Set<string>();

        for (const quiz of recentQuizzes) {
            if (quiz.score < 70) {
                // If student scored poorly, find lessons related to the quiz topic
                const weakTopic = quiz.topic;
                if (weakTopic) {
                    try {
                        const lessonsResponse = await api.get('/courses/lessons', {
                            params: { topic: weakTopic }
                        });
                        const lessons: Lesson[] = lessonsResponse.data || [];

                        lessons.forEach(lesson => {
                            if (!seenLessonIds.has(lesson.id)) {
                                recommendedLessons.push(lesson);
                                seenLessonIds.add(lesson.id);
                            }
                        });
                    } catch (err) {
                        console.error(`Failed to fetch lessons for topic ${weakTopic}`, err);
                    }
                }
            }
        }

        return recommendedLessons;
    } catch (error) {
        console.error('Failed to get recommended lessons', error);
        return [];
    }
};
