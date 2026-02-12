import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progress_percentage: number;
  last_accessed_at: string;
}

interface UpcomingSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  mentor_name: string;
  session_type: string;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    currentStreak: 7
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Fetch Dashboard Data from API
      // Assuming backend has /api/student/dashboard or similar aggregating endpoint
      // OR individual endpoints.

      // Fetch Dashboard Data from API
      // Add timestamp to force fresh data load and bypass cache
      const { data } = await api.get(`/student/dashboard?_t=${Date.now()}`);

      if (data) {
        setEnrolledCourses(data.enrolledCourses || []);
        setUpcomingSessions(data.upcomingSessions || []);
        setStats({
          totalCourses: data.stats?.totalCourses || 0,
          completedCourses: data.stats?.completedCourses || 0,
          totalHours: data.stats?.totalHours || 0,
          currentStreak: data.stats?.currentStreak || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Fallback or empty state handling
    } finally {
      setLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name || user?.email || 'Student'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey where you left off
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalCourses}</h3>
            <p className="text-gray-600 text-sm">Active Courses</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.completedCourses}</h3>
            <p className="text-gray-600 text-sm">Completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalHours}h</h3>
            <p className="text-gray-600 text-sm">Learning Time</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.currentStreak}</h3>
            <p className="text-gray-600 text-sm">Day Streak</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
                <a href="/courses" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All
                </a>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No courses enrolled yet</p>
                  <a
                    href="/courses"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    <span>Browse Courses</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map(course => (
                    <a
                      key={course.id}
                      href={`/course/${course.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>{course.progress_percentage}% complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${course.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
                <a href="/mentors" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Book
                </a>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm mb-4">No upcoming sessions</p>
                  <a
                    href="/mentors"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Find a Mentor
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map(session => (
                    <div
                      key={session.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{session.mentor_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                            {new Date(session.scheduled_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {session.duration_minutes} minutes • {session.session_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
