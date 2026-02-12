import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
// Routes will be imported later to avoid circular dependencies

const PORT = process.env.PROJ_PORT || process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
import { initSocket } from './socket';
import { pool } from './db';

initSocket(server);

// Now import routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './profile/profile.routes';
import coursesRoutes from './routes/courses.routes';
import statsRoutes from './stats/stats.routes';
import adminRoutes from './routes/admin.routes';
import quizRoutes from './routes/quiz.routes';
import chatRoutes from './routes/chat.routes';
import mentorRoutes from './routes/mentor.routes';
import mentorSessionRoutes from './routes/mentorSession.routes';
import studentRoutes from './routes/student.routes';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentor-sessions', mentorSessionRoutes);
app.use('/api/student', studentRoutes);

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});