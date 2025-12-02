import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Star, Calendar, Video, MessageSquare, Users } from 'lucide-react';

interface Mentor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  specializations: string[];
  rating_average: number;
  total_sessions: number;
  is_available: boolean;
}

export function MentorDirectory() {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const specializations = ['all', 'Mathematics', 'Science', 'English', 'Programming', 'Career Guidance'];

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const { data } = await supabase
        .from('mentor_profiles')
        .select(`
          id,
          specializations,
          bio,
          rating_average,
          total_sessions,
          is_available,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('is_available', true)
        .order('rating_average', { ascending: false });

      if (data) {
        const formattedMentors = data.map(m => ({
          id: m.id,
          full_name: (m.profiles as any)?.full_name || 'Unknown',
          avatar_url: (m.profiles as any)?.avatar_url,
          bio: m.bio,
          specializations: m.specializations,
          rating_average: m.rating_average,
          total_sessions: m.total_sessions,
          is_available: m.is_available
        }));
        setMentors(formattedMentors);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = selectedSpecialization === 'all' ||
      mentor.specializations.includes(selectedSpecialization);
    return matchesSearch && matchesSpecialization;
  });

  const openBookingModal = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Mentor</h1>
          <p className="text-gray-600">Connect with experienced mentors for personalized guidance</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search mentors by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {specializations.map(spec => (
              <option key={spec} value={spec}>
                {spec === 'all' ? 'All Specializations' : spec}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map(mentor => (
            <div
              key={mentor.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{mentor.full_name}</h3>
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold text-gray-700">
                      {mentor.rating_average.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({mentor.total_sessions} sessions)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {mentor.bio || 'Experienced mentor ready to help you succeed.'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.specializations.map(spec => (
                  <span
                    key={spec}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openBookingModal(mentor)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Session</span>
                </button>
                <button
                  onClick={() => window.location.href = '/chat'}
                  className="flex items-center justify-center bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No mentors found matching your criteria</p>
          </div>
        )}
      </div>

      {showBookingModal && selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedMentor(null);
          }}
        />
      )}
    </Layout>
  );
}

interface BookingModalProps {
  mentor: Mentor;
  onClose: () => void;
}

function BookingModal({ mentor, onClose }: BookingModalProps) {
  const { profile } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [sessionType, setSessionType] = useState<'video' | 'chat'>('video');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();

      const { error } = await supabase
        .from('mentor_sessions')
        .insert({
          student_id: profile?.id!,
          mentor_id: mentor.id,
          scheduled_at: scheduledAt,
          duration_minutes: duration,
          session_type: sessionType,
          session_notes: notes
        });

      if (!error) {
        setSuccess(true);
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      console.error('Error booking session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Session Booked!</h3>
          <p className="text-gray-600">Your session with {mentor.full_name} has been scheduled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Session with {mentor.full_name}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSessionType('video')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg border-2 transition ${
                  sessionType === 'video'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('chat')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg border-2 transition ${
                  sessionType === 'chat'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What would you like to discuss?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
