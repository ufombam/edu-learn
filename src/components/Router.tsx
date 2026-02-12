import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { CourseCatalog } from '../pages/courses/CourseCatalog';
import { CourseDetail } from '../pages/courses/CourseDetail';
import { LessonViewer } from '../pages/lessons/LessonViewer';
import { MentorDirectory } from '../pages/mentors/MentorDirectory';
import { ChatPage } from '../pages/chat/ChatPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminCourseManagement } from '../pages/admin/AdminCourseManagement';
import { CourseCreation } from '../pages/admin/CourseCreation';
import { UserManagement } from '../pages/admin/UserManagement';
// import { MessagesPage } from '../pages/messages/MessagesPage';
import { MentorSetup } from '../pages/mentor/MentorSetup';

function Router() {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (path === '/register') return <RegisterPage />;
    return <LoginPage />;
  }

  if (user?.role === 'admin' && path.startsWith('/admin')) {
    if (path === '/admin/courses') return <AdminCourseManagement />;
    if (path === '/admin/courses/new') return <CourseCreation />;
    if (path.startsWith('/admin/courses/') && path.endsWith('/edit')) {
      const courseId = path.split('/')[3];
      return <CourseCreation courseId={courseId} />;
    }
    if (path === '/admin/users') return <UserManagement />;
    return <AdminDashboard />;
  }

  if (user?.role === 'mentor' && path === '/mentor/setup') {
    return <MentorSetup />;
  }

  if (path === '/messages') return <ChatPage />;
  if (path === '/courses') return <CourseCatalog />;
  if (path.startsWith('/course/')) {
    const courseId = path.split('/')[2];
    return <CourseDetail courseId={courseId} />;
  }
  if (path.startsWith('/lesson/')) {
    const lessonId = path.split('/')[2];
    return <LessonViewer lessonId={lessonId} />;
  }
  if (path === '/mentors') return <MentorDirectory />;
  if (path === '/chat') return <ChatPage />;
  if (path === '/profile') return <ProfilePage />;

  return <StudentDashboard />;
}

export default Router;

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
}
