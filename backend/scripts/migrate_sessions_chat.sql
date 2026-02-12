-- Add status column to mentor_sessions
ALTER TABLE mentor_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE mentor_sessions ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE;

-- Add message_type and metadata columns to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;
