import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { dummyLessons, mathsLessons, scienceLessons } from '../../utils/dummyLessons';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  is_published: boolean;
  estimated_duration_hours: number;
  created_at: string;
}

export function AdminCourseManagement() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedingCourseId, setSeedingCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (courseId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !isPublished })
        .eq('id', courseId);

      if (error) throw error;
      loadCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const seedDummyLessons = async (courseId: string, lessons: any[]) => {
    setSeedingCourseId(courseId);
    setSeeding(true);

    try {
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const { error } = await supabase.from('lessons').insert({
          course_id: courseId,
          title: lesson.title,
          description: lesson.description,
          content_type: lesson.contentType,
          content_url: lesson.contentUrl || null,
          content_text: lesson.contentText || null,
          duration_minutes: lesson.duration,
          is_downloadable: lesson.saveForOffline,
          order_index: i
        });

        if (error) throw error;
      }

      alert(`Successfully added ${lessons.length} lessons to the course!`);
      loadCourses();
    } catch (error) {
      console.error('Error seeding lessons:', error);
      alert('Failed to seed lessons');
    } finally {
      setSeeding(false);
      setSeedingCourseId(null);
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-2">Create, edit, and manage courses</p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/courses/new'}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Course</span>
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Yet</h3>
            <p className="text-gray-600 mb-6">Create your first course to get started</p>
            <button
              onClick={() => window.location.href = '/admin/courses/new'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Create Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        course.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                        {course.difficulty_level}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Category: <span className="font-medium">{course.category}</span></span>
                      <span>Duration: <span className="font-medium">{course.estimated_duration_hours}h</span></span>
                      <span>Created: <span className="font-medium">{new Date(course.created_at).toLocaleDateString()}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => togglePublish(course.id, course.is_published)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title={course.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {course.is_published ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => window.location.href = `/admin/courses/${course.id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>

                    <div className="relative group">
                      <button
                        onClick={() => seedDummyLessons(
                          course.id,
                          course.category === 'Mathematics'
                            ? mathsLessons
                            : course.category === 'Science'
                            ? scienceLessons
                            : dummyLessons
                        )}
                        disabled={seeding && seedingCourseId === course.id}
                        className="p-2 text-green-600 hover:bg-green-50 disabled:text-gray-400 disabled:hover:bg-transparent rounded-lg transition"
                        title="Seed with dummy lessons"
                      >
                        {seeding && seedingCourseId === course.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600"></div>
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-normal">
                        Add dummy lessons to this course
                      </div>
                    </div>

                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
