import { useState, FormEvent, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../lib/api';
import { ArrowLeft, Plus, Trash2, FileText, Video, BookOpen, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  topic?: string;
}

interface QuizData {
  title: string;
  passingScore: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}

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
  quizData?: QuizData;
}

interface CourseCreationProps {
  courseId?: string;
}

export function CourseCreation({ courseId }: CourseCreationProps) {
  const [step, setStep] = useState<'course' | 'lessons'>('course');
  const [loading, setLoading] = useState(false);
  // If editing, courseId comes from props. If creating, it's set after first step.
  const [activeCourseId, setActiveCourseId] = useState<string>(courseId || '');
  const isEditing = !!courseId;

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Programming',
    difficulty_level: 'beginner' as const,
    estimated_duration_hours: 10,
    thumbnail_url: ''
  });

  interface LessonForm {
    title: string;
    description: string;
    contentType: 'text' | 'video' | 'pdf' | 'quiz';
    contentUrl: string;
    contentText: string;
    duration: number;
    saveForOffline: boolean;
    quizData?: QuizData;
  }

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Array<{ id: string, title: string }>>([]);
  const [lessonForm, setLessonForm] = useState<LessonForm>({
    title: '',
    description: '',
    contentType: 'text',
    contentUrl: '',
    contentText: '',
    duration: 30,
    saveForOffline: true,
    quizData: {
      title: '',
      passingScore: 70,
      questions: []
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    topic: ''
  });

  useEffect(() => {
    if (courseId) {
      loadCourseData(courseId);
    }
    // Fetch all lessons for topic dropdown
    loadAllLessons();
  }, [courseId]);

  const loadAllLessons = async () => {
    try {
      const { data } = await api.get('/admin/lessons/all');
      setAllLessons(data);
    } catch (error) {
      console.error('Error loading all lessons:', error);
    }
  };

  const loadCourseData = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/${id}`);
      // NOTE: reusing student endpoint for simplicity, assuming it returns full structure. 
      // Ideally should use admin specific endpoint if student endpoint hides things.
      // Based on previous view, getCourseDetails returns { course, lessons: [...] }

      setCourseForm({
        title: data.course.title,
        description: data.course.description,
        category: data.course.category,
        difficulty_level: data.course.difficulty_level,
        estimated_duration_hours: data.course.estimated_duration_hours,
        thumbnail_url: data.course.thumbnail_url || ''
      });

      // Transform backend lessons to frontend format
      const loadedLessons = data.lessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        contentType: l.content_type,
        contentUrl: l.content_url || '',
        contentText: l.content_text || '',
        duration: l.duration_minutes,
        saveForOffline: l.is_downloadable,
        orderIndex: l.order_index,
        // Loading quiz data is trickier if not returned by this endpoint.
        // Assuming getCourseDetails does NOT return nested quiz info (usually it doesn't).
        // For full editing, we might need a better endpoint.
        // But let's proceed. If quizData is missing, user might need to recreate quiz.
        // Wait, looking at getCourseDetails implementation: it just does select * from lessons.
        // It does NOT join quizzes.
        // So fetching lessons won't give us quiz questions for editing.
        // This is a limitation. For now, I'll fetch quizzes separately or accept this limitation?
        // No, user wants to EDIT contents. Breaking quizzes is bad.
        // I need to fetch quiz data for each lesson if it's a quiz.
        // Let's rely on updateCourse for now and warn if quiz data is missing?
        // No, I should fix it.
        // Let's assume for now we just load basic lesson info. 
        // If I update the backend `getCourseDetails` to include quiz info it would be better.
        // But that's a student endpoint.
        // I'll stick to what I have. If user edits a quiz lesson, they might reset questions if not careful.
        // Let's verify if `getLesson` gets quiz data.
        // `getLesson` does not join key quiz tables either in the view I saw earlier.
        // Actually, `getLesson` calls `SELECT * FROM lessons`.
        // I need to fetch full course data for editing.
        // I'll implement a proper fetch in useEffect or just use what I have.
        // Since I can't easily change ALL backend endpoints right now without verifying,
        // I'll assume for this task basic course info editing is priority, 
        // and add a TODO or warning for deep quiz editing if complexity is high.
        // BUT, I can try to fetch lesson details individually if needed.
        // Let's just handle course details update first, and basic lesson list update (add/remove).
        // Preserving existing quiz data on updateCourseLessons is handled by my backend logic (delete and insert).
        // Wait, if I delete and insert, I MUST send full data back.
        // If I don't fail to load quiz data, I will lose it on save.
        // Use caution: If I cannot load quiz data, I shouldn't define `quizData` property on loaded lessons, 
        // so maybe I can skip quiz lessons or alert user.
        // ACTUALLY, I'll fetch `GET /courses/lessons/:id` which calls `getCourseDetails`.
        // Then I'll update `lessons` state.
        // The backend `updateCourseLessons` deletes all and inserts.
        // If I send back lessons without quizData, they become empty non-quizzes or crash.
        // I should probably skip 'deep' lesson editing in this pass if retrieval is hard, 
        // OR simply don't delete lessons that haven't changed?
        // Too complex.
        // Let's implement a 'load full course' endpoint or assume `getCourseDetails` returns enough?
        // It currently doesn't return quiz data.
        // I will add a simple logic: only allow editing Title/Description/Metadata of course for now in the main form?
        // No, user said "edit a course AND ITS CONTENTS".
        // I must allow editing lessons.
        // I will add a `getAdminCourse` endpoint in `course.services.ts` that includes EVERYTHING?
        // Or just multiple fetches?
        // I'll do multiple fetches in `loadCourseData`. 
        // For each lesson of type quiz, fetch quiz details? `GET /api/quiz/:lessonId`?
        // `quiz.routes.ts` has `GET /:lessonId` which returns questions! Perfect.
      }));

      // Now fetch quiz details for quiz lessons
      const lessonsWithQuizzes = await Promise.all(loadedLessons.map(async (l: any) => {
        if (l.contentType === 'quiz') {
          try {
            const qRes = await api.get(`/quiz/${l.id}`);
            // qRes.data = { quiz: {title, ...}, questions: [...] }
            if (qRes.data && qRes.data.quiz) {
              return {
                ...l,
                quizData: {
                  title: qRes.data.quiz.title,
                  passingScore: qRes.data.quiz.passing_score,
                  timeLimit: qRes.data.quiz.time_limit_minutes,
                  questions: qRes.data.questions
                }
              };
            }
          } catch (e) {
            console.error("Failed to load quiz details for lesson", l.id);
          }
        }
        return l;
      }));

      setLessons(lessonsWithQuizzes);

    } catch (error) {
      console.error('Error loading course:', error);
      alert('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // Update existing course
        await api.put(`/admin/courses/${activeCourseId}`, courseForm);
      } else {
        // Create new
        const { data } = await api.post('/admin/courses', {
          ...courseForm,
        });
        if (!data.id) throw new Error('No ID returned');
        setActiveCourseId(data.id);
      }

      setStep('lessons');
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const addLesson = () => {
    if (!lessonForm.title || !lessonForm.description) {
      alert('Please fill in lesson title and description');
      return;
    }

    if (lessonForm.contentType === 'quiz' && (!lessonForm.quizData?.questions || lessonForm.quizData.questions.length === 0)) {
      // Warning but allow? or Block? Block is safer.
      alert('Please add at least one question to the quiz');
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
      saveForOffline: true,
      quizData: {
        title: '',
        passingScore: 70,
        questions: []
      }
    });
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text || !currentQuestion.correct_answer) {
      alert('Please fill in the question and correct answer');
      return;
    }

    const updatedQuizData = {
      ...lessonForm.quizData!,
      questions: [...(lessonForm.quizData?.questions || []), currentQuestion]
    };

    setLessonForm({ ...lessonForm, quizData: updatedQuizData });
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      topic: ''
    });
  };

  const removeLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const saveLessons = async () => {
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/admin/courses/${activeCourseId}/lessons`, {
          lessons: lessons.map((l, index) => ({
            ...l,
            content_type: l.contentType,
            content_url: l.contentUrl,
            content_text: l.contentText,
            duration_minutes: l.duration,
            is_downloadable: l.saveForOffline,
            order_index: index,
            quizData: l.quizData
          }))
        });
        alert('Course updated successfully!');
      } else {
        await api.post(`/admin/courses/${activeCourseId}/seed-lessons`, {
          lessons: lessons.map((l, index) => ({
            ...l,
            content_type: l.contentType,
            content_url: l.contentUrl,
            content_text: l.contentText,
            duration_minutes: l.duration,
            is_downloadable: l.saveForOffline,
            order_index: index,
            quizData: l.quizData
          }))
        });
        alert('Course created and lessons added successfully!');
      }

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
          onClick={() => step === 'course' ? window.location.href = '/admin/courses' : setStep('course')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {step === 'course' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing ? 'Edit Course' : 'Create New Course'}</h1>
            <p className="text-gray-600 mb-8">{isEditing ? 'Update course details' : 'Fill in the course details to get started'}</p>

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
                {loading ? 'Saving...' : (isEditing ? 'Update Course Details' : 'Create Course & Add Lessons')}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing ? 'Edit Lessons' : 'Add Lesson Content'}</h1>
              <p className="text-gray-600 mb-8">{isEditing ? 'Manage the lessons for this course' : 'Create lessons for your course with rich content options'}</p>

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

                {lessonForm.contentType === 'quiz' && (
                  <div className="bg-blue-50 p-6 rounded-lg space-y-4 border border-blue-100">
                    <h3 className="font-semibold text-blue-900 border-b border-blue-200 pb-2 flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Configure Quiz Questions
                    </h3>

                    {/* List of questions already added to this lesson */}
                    {lessonForm.quizData?.questions.map((q, qIndex) => (
                      <div key={qIndex} className="bg-white p-3 rounded-md text-sm shadow-sm flex justify-between items-center text-gray-700">
                        <div>
                          <span className="font-bold mr-2 text-blue-600">Q{qIndex + 1}:</span>
                          {q.question_text}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newQs = lessonForm.quizData?.questions.filter((_, i) => i !== qIndex) || [];
                            setLessonForm({ ...lessonForm, quizData: { ...lessonForm.quizData!, questions: newQs } });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        placeholder="Question text"
                        value={currentQuestion.question_text}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      />

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <select
                          value={currentQuestion.topic || ''}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, topic: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Related Lesson (Topic)...</option>
                          {/* Combine database lessons with current lessons being added */}
                          {[
                            ...allLessons,
                            ...lessons
                              .filter(l => l.contentType !== 'quiz')
                              .map(l => ({ id: l.id, title: l.title }))
                          ]
                            // Remove duplicates by title
                            .filter((lesson, index, self) =>
                              index === self.findIndex(l => l.title === lesson.title)
                            )
                            .map(l => (
                              <option key={l.id} value={l.title}>
                                {l.title}
                              </option>
                            ))
                          }
                        </select>
                        <input
                          type="number"
                          placeholder="Points"
                          min="1"
                          value={currentQuestion.points}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {currentQuestion.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`correct-${oIndex}`}
                              name="correct_answer"
                              checked={currentQuestion.correct_answer === opt && opt !== ''}
                              onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: opt })}
                            />
                            <input
                              type="text"
                              placeholder={`Option ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...currentQuestion.options];
                                newOpts[oIndex] = e.target.value;
                                setCurrentQuestion({ ...currentQuestion, options: newOpts });
                              }}
                              className="flex-1 px-3 py-1 border rounded-md text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-blue-600 italic">* Select the radio button for the correct answer</p>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700"
                        >
                          Add Question
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
                  {loading ? 'Saving...' : (isEditing ? 'Update Course & Lessons' : 'Publish Course')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
