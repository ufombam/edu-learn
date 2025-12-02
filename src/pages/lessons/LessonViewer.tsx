import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number;
  order_index: number;
}

interface LessonViewerProps {
  lessonId: string;
}

export function LessonViewer({ lessonId }: LessonViewerProps) {
  const { profile } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (lessonData) {
        setLesson(lessonData);

        const { data: nextLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', lessonData.course_id)
          .gt('order_index', lessonData.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextLesson) {
          setNextLessonId(nextLesson.id);
        }

        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('is_completed')
          .eq('student_id', profile?.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        setIsCompleted(progressData?.is_completed || false);

        await supabase
          .from('lesson_progress')
          .upsert({
            student_id: profile?.id!,
            lesson_id: lessonId,
            last_accessed_at: new Date().toISOString()
          }, { onConflict: 'student_id,lesson_id' });
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    try {
      await supabase
        .from('lesson_progress')
        .upsert({
          student_id: profile?.id!,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'student_id,lesson_id' });

      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Lesson not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a
          href={`/course/${lesson.course_id}`}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
            <p className="text-gray-600 mb-6">{lesson.description}</p>

            <div className="flex items-center space-x-4 mb-8">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full capitalize">
                {lesson.content_type}
              </span>
              <span className="text-sm text-gray-600">{lesson.duration_minutes} minutes</span>
              {isCompleted && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              {lesson.content_type === 'video' && lesson.content_url && (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <p className="text-white">Video Player: {lesson.content_url}</p>
                </div>
              )}

              {lesson.content_type === 'text' && lesson.content_text && (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{lesson.content_text}</div>
                </div>
              )}

              {lesson.content_type === 'pdf' && lesson.content_url && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">PDF Document</p>
                  <a
                    href={lesson.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Open PDF
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              {!isCompleted && (
                <button
                  onClick={markAsComplete}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Mark as Complete</span>
                </button>
              )}

              {nextLessonId && (
                <a
                  href={`/lesson/${nextLessonId}`}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition ml-auto"
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
