import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation
} from '../controllers/chat.controller';

const router = Router();

router.use(requireAuth);

router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/direct', startConversation);
router.post('/messages', sendMessage);

export default router;
