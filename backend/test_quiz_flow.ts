const API_URL = 'http://127.0.0.1:3001/api';

async function testQuizFlow() {
    console.log('--- Starting Quiz Flow Test (using fetch) ---');

    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test Student',
        role: 'admin'
    };

    try {
        // 1. Register/Login
        console.log('Step 1: Registering/Logging in test user...');
        try {
            await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser)
            });
            console.log('User registered.');
        } catch (e: any) {
            console.log('Registration skipped or failed (expected if user exists).');
        }

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });

        if (!loginRes.ok) {
            const errData = await loginRes.json();
            throw new Error(`Login failed: ${loginRes.status} ${JSON.stringify(errData)}`);
        }

        const { token } = await loginRes.json() as { token: string };
        const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        console.log('Logged in successfully.');

        // 2. Find a quiz lesson
        console.log('Step 2: Fetching course catalog...');
        const catalogRes = await fetch(`${API_URL}/courses/catalog`, { headers: authHeader });
        const catalog = await catalogRes.json() as any[];

        if (catalog.length === 0) {
            console.log('No courses found in catalog.');
            return;
        }
        const courseId = catalog[0].id;

        console.log(`Step 3: Fetching details for course ${courseId}...`);
        const courseDetailsRes = await fetch(`${API_URL}/courses/${courseId}`, { headers: authHeader });
        const { lessons } = await courseDetailsRes.json() as { lessons: any[] };
        const quizLesson = lessons.find(l => l.content_type === 'quiz');

        if (!quizLesson) {
            console.log('No quiz lesson found. Types available:', lessons.map(l => l.content_type));
            return;
        }
        console.log(`Found quiz lesson: ${quizLesson.title} (${quizLesson.id})`);

        // 4. Fetch quiz details
        console.log('Step 4: Fetching quiz details...');
        const quizRes = await fetch(`${API_URL}/quizzes/${quizLesson.id}`, { headers: authHeader });
        const quizData = await quizRes.json() as any;
        console.log(`Fetched Quiz: ${quizData.title}`);

        // 5. Direct completion
        console.log('Step 5: Testing completion route...');
        const completeRes = await fetch(`${API_URL}/courses/lessons/${quizLesson.id}/complete`, {
            method: 'POST',
            headers: authHeader
        });
        const completeData = await completeRes.json();
        console.log('Completion Response:', JSON.stringify(completeData));

        // 6. Verify
        console.log('Step 6: Verifying completion...');
        const verifyRes = await fetch(`${API_URL}/courses/lessons/${quizLesson.id}`, { headers: authHeader });
        const verifyData = await verifyRes.json() as any;
        console.log('isCompleted:', verifyData.isCompleted);

        if (verifyData.isCompleted) {
            console.log('--- Test Passed ---');
        } else {
            console.log('--- Test Failed ---');
        }

    } catch (err: any) {
        console.error('Test Process Failed:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

testQuizFlow();
