const API_URL = 'http://127.0.0.1:3001/api';

async function checkMentors() {
    try {
        const res = await fetch(`${API_URL}/mentors`);
        const data = await res.json();
        console.log('Number of mentors:', data.length);
        if (data.length > 0) {
            const m = data[0];
            console.log('Sample Mentor:', m.full_name);
            console.log('rating_average type:', typeof m.rating_average);
            console.log('rating_average value:', m.rating_average);
            console.log('total_sessions type:', typeof m.total_sessions);
            console.log('total_sessions value:', m.total_sessions);
        }
    } catch (err) {
        console.error('Failed to fetch mentors:', err.message);
    }
}

checkMentors();
