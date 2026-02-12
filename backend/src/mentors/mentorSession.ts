import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getIO } from '../socket';

const io = getIO();

export const bookMentorSession = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const {
    mentorId,
    scheduledAt,
    duration,
    sessionType,
    notes
  } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create the mentor session
    const sessionResult = await client.query(
      `
      INSERT INTO mentor_sessions (
        student_id,
        mentor_id,
        scheduled_at,
        duration_minutes,
        session_type,
        session_notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
      RETURNING id
      `,
      [userId, mentorId, scheduledAt, duration, sessionType, notes || null]
    );

    const sessionId = sessionResult.rows[0].id;

    // 2. Find or create a conversation between student and mentor
    let conversationResult = await client.query(`
      SELECT c.id 
      FROM chat_conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2 AND c.type = 'direct'
    `, [userId, mentorId]);

    let conversationId;
    if (conversationResult.rows.length === 0) {
      // Create new conversation
      conversationId = uuid();
      await client.query(
        `INSERT INTO chat_conversations (id, type) VALUES ($1, 'direct')`,
        [conversationId]
      );
      // Add participants
      await client.query(
        `INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES ($1, $2, $3), ($4, $5, $6)`,
        [uuid(), conversationId, userId, uuid(), conversationId, mentorId]
      );
    } else {
      conversationId = conversationResult.rows[0].id;
    }

    // 3. Insert a structured message into the chat
    const messageId = uuid();
    const sentAt = new Date();
    const metadata = {
      sessionId,
      scheduledAt,
      duration,
      sessionType,
      notes,
      mentorId,
      studentId: userId
    };

    await client.query(`
      INSERT INTO chat_messages (
        id, conversation_id, sender_id, message_text, sent_at, message_type, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      messageId,
      conversationId,
      userId,
      `New session booking requested for ${new Date(scheduledAt).toLocaleString()}`,
      sentAt,
      'session_booking',
      JSON.stringify(metadata)
    ]);

    await client.query('COMMIT');

    // 4. Notify via Socket.io
    const sender = await client.query('SELECT full_name FROM public.profiles WHERE id = $1', [userId]);
    io.to(conversationId).emit('new_message', {
      id: messageId,
      conversation_id: conversationId,
      sender_id: userId,
      sender_name: sender.rows[0].full_name,
      message_text: `New session booking requested for ${new Date(scheduledAt).toLocaleString()}`,
      sent_at: sentAt,
      message_type: 'session_booking',
      metadata: metadata,
      attachment_url: null
    });

    res.status(201).json({
      success: true,
      sessionId,
      conversationId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error booking session:', err);
    res.status(500).json({ message: 'Failed to book session' });
  } finally {
    client.release();
  }
};

export const confirmSession = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Note: 'confirmed' is not a valid enum value. Valid values are: scheduled, completed, cancelled
    // Keeping status as 'scheduled' since the session is still scheduled
    const { rows } = await pool.query(
      "UPDATE mentor_sessions SET updated_at = NOW() WHERE id = $1 AND mentor_id = $2 RETURNING *",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Session not found or not authorized' });
    }

    // Add a chat message confirming the session AND update original metadata
    // Find conversation and original booking message
    const msgResult = await pool.query(`
      SELECT id, conversation_id 
      FROM chat_messages 
      WHERE metadata->>'sessionId' = $1 AND message_type = 'session_booking'
      LIMIT 1
    `, [id]);

    if (msgResult.rows.length > 0) {
      const originalMsgId = msgResult.rows[0].id;
      const conversationId = msgResult.rows[0].conversation_id;
      const messageId = uuid();
      const sentAt = new Date();

      // Update original message metadata to hide buttons (handle potential null metadata)
      await pool.query(`
        UPDATE chat_messages 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"status": "confirmed"}'::jsonb
        WHERE id = $1
      `, [originalMsgId]);

      // Insert confirmation text message
      await pool.query(`
        INSERT INTO chat_messages (id, conversation_id, sender_id, message_text, sent_at, message_type, metadata)
        VALUES ($1, $2, $3, $4, $5, 'text', $6)
      `, [messageId, conversationId, userId, 'I have confirmed the session booking!', sentAt, JSON.stringify({ sessionId: id })]);

      const sender = await pool.query('SELECT full_name FROM public.profiles WHERE id = $1', [userId]);

      // Notify about both the update and the new message
      io.to(conversationId).emit('message_updated', {
        id: originalMsgId,
        metadata: { userId, status: 'confirmed' } // Signal UI to update
      });

      io.to(conversationId).emit('new_message', {
        id: messageId,
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: sender.rows[0].full_name,
        message_text: 'I have confirmed the session booking!',
        sent_at: sentAt,
        message_type: 'text',
        metadata: { sessionId: id },
        attachment_url: null
      });
    }

    res.json({ success: true, session: rows[0] });
  } catch (err) {
    console.error('Error confirming session:', err);
    res.status(500).json({ message: 'Failed to confirm session' });
  }
};

export const rescheduleSession = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { newScheduledAt } = req.body;
  const userId = req.userId;

  try {
    // Note: 'pending' is not a valid enum value. Valid values are: scheduled, completed, cancelled
    // Keeping status as 'scheduled' and updating rescheduled_at
    const { rows } = await pool.query(
      "UPDATE mentor_sessions SET rescheduled_at = $1, scheduled_at = $1, updated_at = NOW() WHERE id = $2 AND mentor_id = $3 RETURNING *",
      [newScheduledAt, id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Session not found or not authorized' });
    }

    // Add a chat message about rescheduling AND update original metadata
    const msgResult = await pool.query(`
      SELECT id, conversation_id 
      FROM chat_messages 
      WHERE metadata->>'sessionId' = $1 AND message_type = 'session_booking'
      LIMIT 1
    `, [id]);

    if (msgResult.rows.length > 0) {
      const originalMsgId = msgResult.rows[0].id;
      const conversationId = msgResult.rows[0].conversation_id;
      const messageId = uuid();
      const sentAt = new Date();

      // Update original message metadata to show it's being rescheduled
      await pool.query(`
        UPDATE chat_messages 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"status": "rescheduling"}'::jsonb
        WHERE id = $1
      `, [originalMsgId]);

      await pool.query(`
        INSERT INTO chat_messages (id, conversation_id, sender_id, message_text, sent_at, message_type, metadata)
        VALUES ($1, $2, $3, $4, $5, 'session_booking', $6)
      `, [
        messageId,
        conversationId,
        userId,
        `I would like to reschedule the session to ${new Date(newScheduledAt).toLocaleString()}`,
        sentAt,
        JSON.stringify({ sessionId: id, scheduledAt: newScheduledAt, status: 'rescheduled' })
      ]);

      const sender = await pool.query('SELECT full_name FROM public.profiles WHERE id = $1', [userId]);

      io.to(conversationId).emit('message_updated', {
        id: originalMsgId,
        metadata: { status: 'rescheduling' }
      });

      io.to(conversationId).emit('new_message', {
        id: messageId,
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: sender.rows[0].full_name,
        message_text: `I would like to reschedule the session to ${new Date(newScheduledAt).toLocaleString()}`,
        sent_at: sentAt,
        message_type: 'session_booking',
        metadata: { sessionId: id, scheduledAt: newScheduledAt, status: 'rescheduled' },
        attachment_url: null
      });
    }

    res.json({ success: true, session: rows[0] });
  } catch (err) {
    console.error('Error rescheduling session:', err);
    res.status(500).json({ message: 'Failed to reschedule session' });
  }
};
