import { Router } from 'express';
import { login, register } from '../auth/auth.service';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const userId = await register(email, password, fullName, role);
    res.json({ userId });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

export default router;
