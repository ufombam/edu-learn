/*
  # Remote Learning Platform - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for a remote learning platform
  designed for underserved students in Nigeria with offline-first capabilities.

  ## 1. New Tables

  ### Authentication & Users
  - `profiles` - Extended user profile information
    - `id` (uuid, references auth.users)
    - `role` (enum: student, mentor, admin)
    - `full_name` (text)
    - `avatar_url` (text)
    - `bio` (text)
    - `phone_number` (text)
    - `language_preference` (text: en, ha, yo, ig)
    - `low_bandwidth_mode` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### Learning Content
  - `courses` - Course catalog
    - `id` (uuid, primary key)
    - `title` (text)
    - `description` (text)
    - `thumbnail_url` (text)
    - `category` (text)
    - `difficulty_level` (enum: beginner, intermediate, advanced)
    - `estimated_duration_hours` (integer)
    - `is_published` (boolean)
    - `created_by` (uuid, references profiles)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  - `lessons` - Individual lessons within courses
    - `id` (uuid, primary key)
    - `course_id` (uuid, references courses)
    - `title` (text)
    - `description` (text)
    - `content_type` (enum: video, text, pdf, quiz)
    - `content_url` (text)
    - `content_text` (text)
    - `order_index` (integer)
    - `duration_minutes` (integer)
    - `is_downloadable` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### Progress Tracking
  - `course_enrollments` - Student course enrollments
    - `id` (uuid, primary key)
    - `student_id` (uuid, references profiles)
    - `course_id` (uuid, references courses)
    - `enrolled_at` (timestamptz)
    - `completed_at` (timestamptz, nullable)
    - `progress_percentage` (integer, 0-100)
    - `last_accessed_at` (timestamptz)

  - `lesson_progress` - Lesson completion tracking
    - `id` (uuid, primary key)
    - `student_id` (uuid, references profiles)
    - `lesson_id` (uuid, references lessons)
    - `is_completed` (boolean)
    - `time_spent_minutes` (integer)
    - `completed_at` (timestamptz, nullable)
    - `last_accessed_at` (timestamptz)

  ### Assessments
  - `quizzes` - Quiz definitions
    - `id` (uuid, primary key)
    - `lesson_id` (uuid, references lessons)
    - `title` (text)
    - `passing_score` (integer)
    - `time_limit_minutes` (integer, nullable)
    - `created_at` (timestamptz)

  - `quiz_questions` - Individual quiz questions
    - `id` (uuid, primary key)
    - `quiz_id` (uuid, references quizzes)
    - `question_text` (text)
    - `question_type` (enum: multiple_choice, true_false, short_answer)
    - `options` (jsonb)
    - `correct_answer` (text)
    - `points` (integer)
    - `order_index` (integer)

  - `quiz_attempts` - Student quiz attempts
    - `id` (uuid, primary key)
    - `student_id` (uuid, references profiles)
    - `quiz_id` (uuid, references quizzes)
    - `score` (integer)
    - `answers` (jsonb)
    - `started_at` (timestamptz)
    - `completed_at` (timestamptz, nullable)
    - `is_synced` (boolean)

  ### Mentorship
  - `mentor_profiles` - Extended mentor information
    - `id` (uuid, primary key, references profiles)
    - `specializations` (text array)
    - `bio` (text)
    - `hourly_rate` (decimal, nullable)
    - `availability_schedule` (jsonb)
    - `is_available` (boolean)
    - `rating_average` (decimal)
    - `total_sessions` (integer)

  - `mentor_sessions` - Scheduled mentoring sessions
    - `id` (uuid, primary key)
    - `student_id` (uuid, references profiles)
    - `mentor_id` (uuid, references mentor_profiles)
    - `scheduled_at` (timestamptz)
    - `duration_minutes` (integer)
    - `status` (enum: scheduled, completed, cancelled, no_show)
    - `session_notes` (text)
    - `session_type` (enum: chat, video, both)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  - `session_reviews` - Student reviews of mentor sessions
    - `id` (uuid, primary key)
    - `session_id` (uuid, references mentor_sessions)
    - `student_id` (uuid, references profiles)
    - `mentor_id` (uuid, references mentor_profiles)
    - `rating` (integer, 1-5)
    - `review_text` (text)
    - `created_at` (timestamptz)

  ### Communication
  - `chat_conversations` - Chat threads
    - `id` (uuid, primary key)
    - `type` (enum: direct, group)
    - `name` (text, nullable)
    - `created_by` (uuid, references profiles)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  - `conversation_participants` - Users in conversations
    - `id` (uuid, primary key)
    - `conversation_id` (uuid, references chat_conversations)
    - `user_id` (uuid, references profiles)
    - `joined_at` (timestamptz)
    - `last_read_at` (timestamptz)

  - `chat_messages` - Individual messages
    - `id` (uuid, primary key)
    - `conversation_id` (uuid, references chat_conversations)
    - `sender_id` (uuid, references profiles)
    - `message_text` (text)
    - `attachment_url` (text, nullable)
    - `attachment_type` (text, nullable)
    - `is_synced` (boolean)
    - `sent_at` (timestamptz)
    - `edited_at` (timestamptz, nullable)

  ### Offline Support
  - `offline_content` - Content downloads for offline access
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `content_type` (enum: course, lesson, resource)
    - `content_id` (uuid)
    - `downloaded_at` (timestamptz)
    - `last_accessed_at` (timestamptz)
    - `size_bytes` (bigint)

  - `sync_queue` - Items pending synchronization
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `action_type` (text)
    - `entity_type` (text)
    - `entity_id` (uuid)
    - `payload` (jsonb)
    - `created_at` (timestamptz)
    - `synced_at` (timestamptz, nullable)
    - `sync_attempts` (integer)

  ### Notifications
  - `notifications` - User notifications
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `type` (text)
    - `title` (text)
    - `message` (text)
    - `action_url` (text, nullable)
    - `is_read` (boolean)
    - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for role-based access control
  - Ensure students can only access their own data
  - Mentors can access their sessions and student interactions
  - Admins have full access

  ## 3. Indexes
  - Add indexes for frequently queried columns
  - Optimize for mobile and low-bandwidth queries
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE content_type AS ENUM ('video', 'text', 'pdf', 'quiz');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE session_type AS ENUM ('chat', 'video', 'both');
CREATE TYPE conversation_type AS ENUM ('direct', 'group');
CREATE TYPE offline_content_type AS ENUM ('course', 'lesson', 'resource');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  phone_number text,
  language_preference text DEFAULT 'en',
  low_bandwidth_mode boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  difficulty_level difficulty_level DEFAULT 'beginner',
  estimated_duration_hours integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type content_type NOT NULL,
  content_url text,
  content_text text,
  order_index integer NOT NULL DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  is_downloadable boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0,
  last_accessed_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  time_spent_minutes integer DEFAULT 0,
  completed_at timestamptz,
  last_accessed_at timestamptz DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer DEFAULT 70,
  time_limit_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  points integer DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  answers jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  is_synced boolean DEFAULT true
);

-- Mentor profiles table
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specializations text[] DEFAULT '{}',
  bio text,
  hourly_rate decimal(10,2),
  availability_schedule jsonb DEFAULT '{}',
  is_available boolean DEFAULT true,
  rating_average decimal(3,2) DEFAULT 0,
  total_sessions integer DEFAULT 0
);

-- Mentor sessions table
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status session_status DEFAULT 'scheduled',
  session_notes text,
  session_type session_type DEFAULT 'video',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Session reviews table
CREATE TABLE IF NOT EXISTS session_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type DEFAULT 'direct',
  name text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  attachment_url text,
  attachment_type text,
  is_synced boolean DEFAULT true,
  sent_at timestamptz DEFAULT now(),
  edited_at timestamptz
);

-- Offline content table
CREATE TABLE IF NOT EXISTS offline_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type offline_content_type NOT NULL,
  content_id uuid NOT NULL,
  downloaded_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  size_bytes bigint DEFAULT 0,
  UNIQUE(user_id, content_type, content_id)
);

-- Sync queue table
CREATE TABLE IF NOT EXISTS sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  sync_attempts integer DEFAULT 0
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student ON mentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_scheduled ON mentor_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent ON chat_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Admins and mentors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'mentor')
    )
  );

CREATE POLICY "Course creators can update their courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Lessons policies
CREATE POLICY "Users can view lessons of enrolled or published courses"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND (
        courses.is_published = true
        OR courses.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = courses.id
          AND course_enrollments.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Course creators can manage lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.created_by = auth.uid()
    )
  );

-- Course enrollments policies
CREATE POLICY "Students can view own enrollments"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can enroll in courses"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own enrollments"
  ON course_enrollments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Lesson progress policies
CREATE POLICY "Students can view own progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can track own progress"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own progress"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Quiz policies
CREATE POLICY "Users can view quizzes for accessible lessons"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND (
        courses.is_published = true
        OR courses.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = courses.id
          AND course_enrollments.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Course creators can manage quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND courses.created_by = auth.uid()
    )
  );

-- Quiz questions policies
CREATE POLICY "Users can view quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN lessons ON lessons.id = quizzes.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND (
        courses.is_published = true
        OR courses.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = courses.id
          AND course_enrollments.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Course creators can manage quiz questions"
  ON quiz_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN lessons ON lessons.id = quizzes.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND courses.created_by = auth.uid()
    )
  );

-- Quiz attempts policies
CREATE POLICY "Students can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own quiz attempts"
  ON quiz_attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Mentor profiles policies
CREATE POLICY "Anyone can view mentor profiles"
  ON mentor_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can manage own profile"
  ON mentor_profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Mentor sessions policies
CREATE POLICY "Participants can view their sessions"
  ON mentor_sessions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "Students can book sessions"
  ON mentor_sessions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update their sessions"
  ON mentor_sessions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() OR mentor_id = auth.uid())
  WITH CHECK (student_id = auth.uid() OR mentor_id = auth.uid());

-- Session reviews policies
CREATE POLICY "Users can view reviews for their sessions"
  ON session_reviews FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR mentor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mentor_profiles
      WHERE mentor_profiles.id = session_reviews.mentor_id
    )
  );

CREATE POLICY "Students can create reviews"
  ON session_reviews FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Chat conversations policies
CREATE POLICY "Participants can view their conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = chat_conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Conversation participants policies
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_participants.conversation_id
      AND chat_conversations.created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Chat messages policies
CREATE POLICY "Participants can view conversation messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = chat_messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = chat_messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Senders can update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Offline content policies
CREATE POLICY "Users can manage own offline content"
  ON offline_content FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sync queue policies
CREATE POLICY "Users can manage own sync queue"
  ON sync_queue FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_sessions_updated_at BEFORE UPDATE ON mentor_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();