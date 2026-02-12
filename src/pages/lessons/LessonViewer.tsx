import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../lib/api';
// import { supabase } from '../../lib/supabase'; // Removed - CLEANED
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

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any; // Can be array of strings or object
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  passing_score: number;
  time_limit_minutes: number | null;
  questions: QuizQuestion[];
}

interface LessonViewerProps {
  lessonId: string;
}

export function LessonViewer({ lessonId }: LessonViewerProps) {
  // const { profile } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; weakTopics?: string[] } | null>(null);
  const [recommendedLessons, setRecommendedLessons] = useState<any[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const { data } = await api.get(`/courses/lessons/${lessonId}`);

      if (data.lesson) {
        setLesson(data.lesson);

        // Fetch quiz if content type is quiz
        if (data.lesson.content_type === 'quiz') {
          try {
            const quizRes = await api.get(`/quizzes/${lessonId}`);
            setQuiz(quizRes.data);
          } catch (err) {
            console.error('Error loading quiz info:', err);
          }
        }
      }

      if (data.nextLessonId) {
        setNextLessonId(data.nextLessonId);
      }

      setIsCompleted(!!data.isCompleted);

    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    try {
      await api.post(`/courses/lessons/${lessonId}/complete`);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setSubmittingQuiz(true);
    try {
      const { data } = await api.post(`/quizzes/${quiz.id}/attempt`, {
        answers: quizAnswers
      });
      setQuizResult(data);
      setQuizResult(data);
      if (data.passed) {
        await markAsComplete();
      } else if (data.weakTopics && data.weakTopics.length > 0) {
        // Fetch recommendations
        try {
          const recommendations = [];
          for (const topic of data.weakTopics) {
            // Add timestamp to ensure fresh recommendations and bypass SW cache
            const res = await api.get(`/courses/lessons?topic=${encodeURIComponent(topic)}&_t=${Date.now()}`);
            if (res.data) recommendations.push(...res.data);
          }
          // Dedup
          const unique = Array.from(new Map(recommendations.map(l => [l.id, l])).values());
          setRecommendedLessons(unique);
        } catch (err) {
          console.error("Failed to load recommendations", err);
        }
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setSubmittingQuiz(false);
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

              {lesson.content_type === 'quiz' && quiz && (
                <div className="space-y-8">
                  {quizResult ? (
                    <div className={`p-8 rounded-xl text-center ${quizResult.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <h3 className={`text-2xl font-bold mb-2 ${quizResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                        {quizResult.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                      </h3>
                      <p className="text-lg mb-6 text-gray-700">
                        Your score: <span className="font-bold">{Math.round(quizResult.score)}%</span>
                        {quizResult.passed ? ` (Passing score: ${quiz.passing_score}%)` : ` (Required: ${quiz.passing_score}%)`}
                      </p>

                      {!quizResult.passed && recommendedLessons.length > 0 && (
                        <div className="mb-6 text-left bg-white p-4 rounded-lg shadow-sm">
                          <h4 className="font-bold text-gray-800 mb-2">Recommended Lessons to Review:</h4>
                          <ul className="space-y-2">
                            {recommendedLessons.map((l, i) => (
                              <li key={i} className="flex justify-between items-center border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded">
                                <div>
                                  <span className="text-blue-600 font-medium">{l.course_title}:</span> <span className="text-gray-700">{l.title}</span>
                                </div>
                                <a href={`/lesson/${l.id}`} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
                                  Go to Lesson
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!quizResult.passed && (
                        <button
                          onClick={() => { setQuizResult(null); setQuizAnswers({}); setRecommendedLessons([]); setCurrentQuestionIndex(0); }}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6">
                        {quiz.questions.length > 0 && (
                          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-gray-500">
                                Question {currentQuestionIndex + 1} of {quiz.questions.length}
                              </span>
                              <div className="w-1/3 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="mb-6">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {quiz.questions[currentQuestionIndex].question_text}
                              </h3>
                              {quiz.questions[currentQuestionIndex].options && (
                                <div className="grid grid-cols-1 gap-3 mt-4">
                                  {Array.isArray(quiz.questions[currentQuestionIndex].options) && quiz.questions[currentQuestionIndex].options.map((option: string) => (
                                    <button
                                      key={option}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [quiz.questions[currentQuestionIndex].id]: option }))}
                                      className={`p-4 text-left rounded-lg border transition ${quizAnswers[quiz.questions[currentQuestionIndex].id] === option
                                        ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                                        }`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between pt-4">
                              <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="text-gray-600 hover:text-gray-900 px-4 py-2 disabled:opacity-50"
                              >
                                Previous
                              </button>

                              {currentQuestionIndex < quiz.questions.length - 1 ? (
                                <button
                                  onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                  Next
                                </button>
                              ) : (
                                <button
                                  onClick={submitQuiz}
                                  disabled={submittingQuiz || Object.keys(quizAnswers).length < quiz.questions.length}
                                  className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 shadow-md"
                                >
                                  {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
    </Layout >
  );
}
