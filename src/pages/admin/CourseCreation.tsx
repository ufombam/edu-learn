import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, FileText, Video, BookOpen, HelpCircle } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'text' | 'pdf' | 'quiz';
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  saveForOffline: boolean;
  orderIndex: number;
}

export function CourseCreation() {
  const { user } = useAuth();
  const [step, setStep] = useState<'course' | 'lessons'>('course');
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState<string>('');

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Programming',
    difficulty_level: 'beginner' as const,
    estimated_duration_hours: 10,
    thumbnail_url: ''
  });

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    contentType: 'text' as const,
    contentUrl: '',
    contentText: '',
    duration: 30,
    saveForOffline: true
  });

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseForm,
          created_by: user?.id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      setCourseId(data.id);
      setStep('lessons');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const addLesson = () => {
    if (!lessonForm.title || !lessonForm.description) {
      alert('Please fill in lesson title and description');
      return;
    }

    const newLesson: Lesson = {
      id: Date.now().toString(),
      ...lessonForm,
      orderIndex: lessons.length
    };

    setLessons([...lessons, newLesson]);
    setLessonForm({
      title: '',
      description: '',
      contentType: 'text',
      contentUrl: '',
      contentText: '',
      duration: 30,
      saveForOffline: true
    });
  };

  const removeLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const saveLessons = async () => {
    setLoading(true);
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

      alert('Course and lessons created successfully!');
      window.location.href = '/admin';
    } catch (error) {
      console.error('Error saving lessons:', error);
      alert('Failed to save lessons');
    } finally {
      setLoading(false);
    }
  };

  const contentTypeIcons = {
    text: <FileText className="w-5 h-5" />,
    video: <Video className="w-5 h-5" />,
    pdf: <BookOpen className="w-5 h-5" />,
    quiz: <HelpCircle className="w-5 h-5" />
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => step === 'course' ? window.location.href = '/admin' : setStep('course')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {step === 'course' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
            <p className="text-gray-600 mb-8">Fill in the course details to get started</p>

            <form onSubmit={handleCourseSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what students will learn..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Programming</option>
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>Languages</option>
                    <option>Business</option>
                    <option>Arts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <select
                    value={courseForm.difficulty_level}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (hours)</label>
                <input
                  type="number"
                  min="1"
                  value={courseForm.estimated_duration_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, estimated_duration_hours: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={courseForm.thumbnail_url}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Create Course & Add Lessons'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Lesson Content</h1>
              <p className="text-gray-600 mb-8">Create lessons for your course with rich content options</p>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">{lessons.length}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lessons Added</h3>
                    <p className="text-sm text-gray-600">Total duration: {lessons.reduce((acc, l) => acc + (l.duration || 0), 0)} minutes</p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); addLesson(); }} className="space-y-6 mb-8 pb-8 border-b border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title</label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Introduction to HTML"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Description</label>
                  <textarea
                    required
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the lesson content..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                    <select
                      value={lessonForm.contentType}
                      onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="text">Text Content</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {lessonForm.contentType === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Content</label>
                    <textarea
                      value={lessonForm.contentText}
                      onChange={(e) => setLessonForm({ ...lessonForm, contentText: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter the lesson text content here..."
                    />
                  </div>
                )}

                {(lessonForm.contentType === 'video' || lessonForm.contentType === 'pdf') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content URL</label>
                    <input
                      type="url"
                      value={lessonForm.contentUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={lessonForm.contentType === 'video' ? 'https://youtube.com/...' : 'https://example.com/document.pdf'}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="saveForOffline"
                    checked={lessonForm.saveForOffline}
                    onChange={(e) => setLessonForm({ ...lessonForm, saveForOffline: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="saveForOffline" className="text-sm font-medium text-gray-700">
                    Save for Offline Access (PWA Caching)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Lesson</span>
                </button>
              </form>

              {lessons.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Lessons ({lessons.length})</h3>
                  {lessons.map((lesson, index) => (
                    <div key={lesson.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="bg-blue-100 p-2 rounded-lg mt-1">
                          {contentTypeIcons[lesson.contentType]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="inline-block bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                            <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded capitalize">
                              {lesson.contentType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{lesson.duration} min</span>
                            {lesson.saveForOffline && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Offline</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLesson(lesson.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lessons.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={saveLessons}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
                >
                  {loading ? 'Saving Course & Lessons...' : 'Publish Course'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
