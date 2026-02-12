import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../lib/api';
import { Clock, BookOpen, CheckCircle, Circle, Play, FileText, Video } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: string;
  duration_minutes: number;
  order_index: number;
  is_completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_hours: number;
}

interface CourseDetailProps {
  courseId: string;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}`);

      // Backend returns { course, lessons, progress }
      if (data.course) {
        setCourse(data.course);
      }

      if (data.lessons) {
        setLessons(data.lessons);
      }

      if (typeof data.progress === 'number') {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'text': return <BookOpen className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
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

  if (!course) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Course not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-br from-blue-500 to-green-500"></div>
          <div className="p-8">
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {course.category}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                {course.difficulty_level}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
            <p className="text-gray-600 mb-6">{course.description}</p>

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{course.estimated_duration_hours} hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>{lessons.length} lessons</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Course Progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>

          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <a
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 ${lesson.is_completed ? 'text-green-600' : 'text-gray-400'}`}>
                    {lesson.is_completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Lesson {index + 1}
                      </span>
                      <div className="flex items-center space-x-1 text-gray-500">
                        {getContentIcon(lesson.content_type)}
                        <span className="text-sm capitalize">{lesson.content_type}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{lesson.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{lesson.duration_minutes} min</p>
                    </div>
                    <Play className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </a>
            ))}
          </div>

          {lessons.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No lessons available yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
