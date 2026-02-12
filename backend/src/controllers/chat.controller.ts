import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../db';
import { io } from '../socket';
import { AuthRequest } from '../auth/auth.middleware';

export const getConversations = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!; // from auth middleware

  const conversations = await pool.query(`
    SELECT
      c.id,
      c.type,
      c.name,
      u.full_name AS other_user_name,
      m.message_text AS last_message,
      m.sent_at AS last_message_time,
      0 AS unread_count
    FROM chat_conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
    JOIN public.profiles u ON u.id = cp2.user_id
    LEFT JOIN LATERAL (
      SELECT message_text, sent_at
      FROM chat_messages
      WHERE conversation_id = c.id
      ORDER BY sent_at DESC
      LIMIT 1
    ) m ON true
    WHERE cp.user_id = $1
      AND cp2.user_id <> $1
    ORDER BY m.sent_at DESC NULLS LAST
  `, [userId]);

  res.json(conversations.rows);
};

export const getMessages = async (req: Request, res: Response) => {
  const { id } = req.params;

  const messages = await pool.query(`
    SELECT
      m.id,
      m.sender_id,
      u.full_name AS sender_name,
      m.message_text,
      m.sent_at,
      m.attachment_url,
      m.message_type,
      m.metadata
    FROM chat_messages m
    JOIN public.profiles u ON u.id = m.sender_id
    WHERE m.conversation_id = $1
    ORDER BY m.sent_at ASC
  `, [id]);

  res.json(messages.rows);
};

export const startConversation = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ message: 'Participant ID is required' });
  }

  const client = await pool.connect();
  try {
    // Check if direct conversation already exists
    const existing = await client.query(`
      SELECT c.id 
      FROM chat_conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2 AND c.type = 'direct'
    `, [userId, participantId]);

    if (existing.rows.length > 0) {
      return res.json({ id: existing.rows[0].id });
    }

    // Create new conversation
    const conversationId = uuid();
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO chat_conversations (id, type) VALUES ($1, 'direct')`,
      [conversationId]
    );

    // Add participants
    await client.query(
      `INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [uuid(), conversationId, userId, uuid(), conversationId, participantId]
    );

    await client.query('COMMIT');
    res.status(201).json({ id: conversationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error starting conversation:', err);
    res.status(500).json({ message: 'Failed to start conversation' });
  } finally {
    client.release();
  }
};


export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { conversationId, messageText, messageType, metadata } = req.body;
  const senderId = req.userId!;

  const newMessage = {
    id: uuid(),
    conversation_id: conversationId,
    sender_id: senderId,
    message_text: messageText,
    sent_at: new Date(),
    message_type: messageType || 'text',
    metadata: metadata ? JSON.stringify(metadata) : null
  };

  await pool.query(`
    INSERT INTO chat_messages (
      id, conversation_id, sender_id, message_text, sent_at, message_type, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    newMessage.id,
    newMessage.conversation_id,
    newMessage.sender_id,
    newMessage.message_text,
    newMessage.sent_at,
    newMessage.message_type,
    newMessage.metadata
  ]);

  // fetch sender name
  const sender = await pool.query(
    'SELECT full_name FROM public.profiles WHERE id = $1',
    [senderId]
  );

  io.to(conversationId).emit('new_message', {
    ...newMessage,
    sender_name: sender.rows[0].full_name,
    attachment_url: null,
    metadata: metadata || null // emit as object
  });

  res.status(201).json({ success: true, id: newMessage.id });
};





