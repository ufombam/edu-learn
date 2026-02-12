import axios from 'axios';

async function test() {
    try {
        const baseUrl = 'http://localhost:3001/api';
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'Password@123';

        console.log(`Registering test user: ${email}...`);
        await axios.post(`${baseUrl}/auth/register`, {
            email,
            password,
            fullName: 'Test Admin',
            role: 'admin'
        });

        console.log('Logging in...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email,
            password
        });

        const token = loginRes.data.token;
        console.log('Login successful, token retrieved.');

        console.log('Attempting to create course with quiz...');
        const courseRes = await axios.post(`${baseUrl}/admin/courses`, {
            title: 'Quiz Test Course ' + Date.now(),
            description: 'Test Description',
            category: 'Programming',
            difficulty_level: 'beginner',
            estimated_duration_hours: 5,
            thumbnail_url: 'http://test.com/img.jpg'
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const courseId = courseRes.data.id;
        console.log('Course created, ID:', courseId);

        console.log('Seeding lessons including a quiz...');
        await axios.post(`${baseUrl}/admin/courses/${courseId}/seed-lessons`, {
            lessons: [
                {
                    title: 'Lesson 1: Intro',
                    description: 'Text lesson',
                    contentType: 'text',
                    contentText: 'Hello world',
                    duration: 10,
                    saveForOffline: true
                },
                {
                    title: 'Lesson 2: Knowledge Check',
                    description: 'Quiz lesson',
                    contentType: 'quiz',
                    duration: 15,
                    saveForOffline: true,
                    quizData: {
                        title: 'Basic Quiz',
                        passingScore: 70,
                        questions: [
                            {
                                question_text: 'What is 1+1?',
                                question_type: 'multiple_choice',
                                options: ['1', '2', '3', '4'],
                                correct_answer: '2',
                                points: 5
                            }
                        ]
                    }
                }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Course and Quiz seeded successfully.');

        // Test fetching the quiz as the same user (student role check)
        console.log('Testing quiz retrieval...');
        const lessonsRes = await axios.get(`${baseUrl}/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const quizLesson = lessonsRes.data.lessons.find((l: any) => l.content_type === 'quiz');
        console.log('Found quiz lesson, ID:', quizLesson.id);

        const quizRes = await axios.get(`${baseUrl}/quizzes/${quizLesson.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Quiz data retrieved:', quizRes.data.title);

        console.log('Verification finished successfully!');
    } catch (err: any) {
        if (err.response) {
            console.error('Error status:', err.response.status);
            console.error('Error data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error message:', err.message);
        }
    }
}

test();
