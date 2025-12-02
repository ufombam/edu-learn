export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'mentor' | 'admin';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'video' | 'text' | 'pdf' | 'quiz';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type SessionType = 'chat' | 'video' | 'both';
export type ConversationType = 'direct' | 'group';
export type OfflineContentType = 'course' | 'lesson' | 'resource';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          phone_number: string | null;
          language_preference: string;
          low_bandwidth_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
          language_preference?: string;
          low_bandwidth_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
          language_preference?: string;
          low_bandwidth_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          category: string | null;
          difficulty_level: DifficultyLevel;
          estimated_duration_hours: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          category?: string | null;
          difficulty_level?: DifficultyLevel;
          estimated_duration_hours?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          category?: string | null;
          difficulty_level?: DifficultyLevel;
          estimated_duration_hours?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          content_type: ContentType;
          content_url: string | null;
          content_text: string | null;
          order_index: number;
          duration_minutes: number;
          is_downloadable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          content_type: ContentType;
          content_url?: string | null;
          content_text?: string | null;
          order_index?: number;
          duration_minutes?: number;
          is_downloadable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          content_type?: ContentType;
          content_url?: string | null;
          content_text?: string | null;
          order_index?: number;
          duration_minutes?: number;
          is_downloadable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          enrolled_at: string;
          completed_at: string | null;
          progress_percentage: number;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          enrolled_at?: string;
          completed_at?: string | null;
          progress_percentage?: number;
          last_accessed_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          enrolled_at?: string;
          completed_at?: string | null;
          progress_percentage?: number;
          last_accessed_at?: string;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          student_id: string;
          lesson_id: string;
          is_completed: boolean;
          time_spent_minutes: number;
          completed_at: string | null;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          lesson_id: string;
          is_completed?: boolean;
          time_spent_minutes?: number;
          completed_at?: string | null;
          last_accessed_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          lesson_id?: string;
          is_completed?: boolean;
          time_spent_minutes?: number;
          completed_at?: string | null;
          last_accessed_at?: string;
        };
      };
      mentor_profiles: {
        Row: {
          id: string;
          specializations: string[];
          bio: string | null;
          hourly_rate: number | null;
          availability_schedule: Json;
          is_available: boolean;
          rating_average: number;
          total_sessions: number;
        };
        Insert: {
          id: string;
          specializations?: string[];
          bio?: string | null;
          hourly_rate?: number | null;
          availability_schedule?: Json;
          is_available?: boolean;
          rating_average?: number;
          total_sessions?: number;
        };
        Update: {
          id?: string;
          specializations?: string[];
          bio?: string | null;
          hourly_rate?: number | null;
          availability_schedule?: Json;
          is_available?: boolean;
          rating_average?: number;
          total_sessions?: number;
        };
      };
      mentor_sessions: {
        Row: {
          id: string;
          student_id: string;
          mentor_id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: SessionStatus;
          session_notes: string | null;
          session_type: SessionType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          mentor_id: string;
          scheduled_at: string;
          duration_minutes?: number;
          status?: SessionStatus;
          session_notes?: string | null;
          session_type?: SessionType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          mentor_id?: string;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: SessionStatus;
          session_notes?: string | null;
          session_type?: SessionType;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_conversations: {
        Row: {
          id: string;
          type: ConversationType;
          name: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type?: ConversationType;
          name?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: ConversationType;
          name?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message_text: string;
          attachment_url: string | null;
          attachment_type: string | null;
          is_synced: boolean;
          sent_at: string;
          edited_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          message_text: string;
          attachment_url?: string | null;
          attachment_type?: string | null;
          is_synced?: boolean;
          sent_at?: string;
          edited_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          message_text?: string;
          attachment_url?: string | null;
          attachment_type?: string | null;
          is_synced?: boolean;
          sent_at?: string;
          edited_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          action_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
