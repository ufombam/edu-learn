const fs = require('fs');
const API_URL = 'http://127.0.0.1:3001/api';

async function testQuizFlow() {
    console.log('--- Starting Quiz Flow Test (JS) ---');

    const testUser = {
        email: 'test_recent@example.com',
        password: 'password123',
        fullName: 'Test Recent Student',
        role: 'admin'
    };

    try {
        console.log('Step 1: Registering/Logging in...');
        try {
            const regRes = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser)
            });
            if (regRes.ok) {
                console.log('User registered.');
            } else {
                console.log('Registration status:', regRes.status, await regRes.text());
            }
        } catch (e) {
            console.log('Registration error:', e.message);
        }

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });

        if (!loginRes.ok) {
            const errBody = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${errBody}`);
        }

        const { token } = await loginRes.json();
        const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        console.log('Logged in successfully.');

        console.log('Step 2: Fetching course catalog...');
        const catalogRes = await fetch(`${API_URL}/courses/catalog`, { headers: authHeader });
        const catalog = await catalogRes.json();

        if (!catalog || catalog.length === 0) {
            console.log('No courses found.');
            return;
        }
        const courseId = catalog[0].id;
        console.log(`Course ID from catalog: ${courseId}`);

        console.log(`Step 3: Fetching details for course ${courseId}...`);
        const courseDetailsRes = await fetch(`${API_URL}/courses/${courseId}`, { headers: authHeader });
        const courseData = await courseDetailsRes.json();

        fs.writeFileSync('test_debug_response.json', JSON.stringify(courseData, null, 2));

        const lessons = courseData.lessons;
        if (!lessons) {
            console.log('Lessons property is missing!');
            console.log('Message:', courseData.message);
            console.log('Detail:', courseData.detail);
            return;
        }

        const quizLesson = lessons.find(l => l.content_type === 'quiz');

        if (!quizLesson) {
            console.log('No quiz lesson found. Types available:', lessons.map(l => l.content_type));
            return;
        }
        console.log(`Found quiz lesson: ${quizLesson.title}`);

        console.log('Step 4: Fetching quiz details...');
        const quizRes = await fetch(`${API_URL}/quizzes/${quizLesson.id}`, { headers: authHeader });
        if (!quizRes.ok) throw new Error(`Quiz fetch failed: ${quizRes.status}`);
        const quizData = await quizRes.json();
        console.log(`Fetched Quiz: ${quizData.title}`);

        console.log('Step 5: Testing completion...');
        const completeRes = await fetch(`${API_URL}/courses/lessons/${quizLesson.id}/complete`, {
            method: 'POST',
            headers: authHeader
        });
        const completeData = await completeRes.json();
        console.log('Completion Response:', JSON.stringify(completeData));

        console.log('Step 6: Verifying...');
        const verifyRes = await fetch(`${API_URL}/courses/lessons/${quizLesson.id}`, { headers: authHeader });
        const verifyData = await verifyRes.json();
        console.log('isCompleted:', verifyData.isCompleted);

        if (verifyData.isCompleted) {
            console.log('--- TEST PASSED ---');
        } else {
            console.log('--- TEST FAILED ---');
        }

    } catch (err) {
        console.error('Test Process Failed:', err.message);
    }
}

testQuizFlow();
