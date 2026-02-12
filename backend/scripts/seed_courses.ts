import dotenv from 'dotenv';
dotenv.config();
import { pool } from '../src/db';

async function seedCourses() {
    try {
        console.log('Seeding courses...');

        // Helper to create course
        const createCourse = async (title: string, description: string, category: string) => {
            const res = await pool.query(
                `INSERT INTO courses (title, description, category, thumbnail_url) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
                [title, description, category, 'https://source.unsplash.com/random/800x600?education']
            );
            return res.rows[0].id;
        };

        // Helper to create lesson
        const createLesson = async (courseId: string, title: string, order: number) => {
            const res = await pool.query(
                `INSERT INTO lessons (course_id, title, content, order_index) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
                [courseId, title, 'Lesson content placeholder...', order]
            );
            return res.rows[0].id;
        };

        // Helper to create quiz
        const createQuiz = async (lessonId: string, title: string) => {
            const res = await pool.query(
                `INSERT INTO quizzes (lesson_id, title) 
         VALUES ($1, $2) RETURNING id`,
                [lessonId, title]
            );
            return res.rows[0].id;
        };

        // Helper to create question
        const createQuestion = async (quizId: string, text: string, options: any, correct: string, topic: string) => {
            await pool.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, topic, order_index) 
         VALUES ($1, $2, 'multiple_choice', $3, $4, $5, 1)`,
                [quizId, text, JSON.stringify(options), correct, topic]
            );
        };

        // 1. English Language
        const engId = await createCourse('English Language', 'Master English grammar and comprehension.', 'Language');
        const engL1 = await createLesson(engId, 'Grammar Basics', 1);
        const engQ1 = await createQuiz(engL1, 'Grammar Quiz');
        await createQuestion(engQ1, 'Identify the noun: "The cat runs."', ['The', 'cat', 'runs'], 'cat', 'Nouns');
        await createQuestion(engQ1, 'Identify the verb: "She sings well."', ['She', 'sings', 'well'], 'sings', 'Verbs');

        // 2. Biology
        const bioId = await createCourse('Biology', 'Introduction to living organisms.', 'Science');
        const bioL1 = await createLesson(bioId, 'Cell Structure', 1);
        const bioQ1 = await createQuiz(bioL1, 'Cells Quiz');
        await createQuestion(bioQ1, 'Powerhouse of the cell?', ['Nucleus', 'Mitochondria', 'Ribosome'], 'Mitochondria', 'Cell Organelles');
        await createQuestion(bioQ1, 'Control center of the cell?', ['Nucleus', 'Mitochondria', 'Ribosome'], 'Nucleus', 'Cell Organelles');

        // 3. Economics
        const ecoId = await createCourse('Economics', 'Understanding supply and demand.', 'Social Science');
        const ecoL1 = await createLesson(ecoId, 'Supply and Demand', 1);
        const ecoQ1 = await createQuiz(ecoL1, 'Market Quiz');
        await createQuestion(ecoQ1, 'What happens to price when demand increases?', ['Increases', 'Decreases', 'Stays same'], 'Increases', 'Supply & Demand');

        console.log('Seeding complete.');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

seedCourses();
