import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { ArrowRight, Plus, X } from 'lucide-react';

export function MentorSetup() {
  const { user, updateProfile } = useAuth();
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');

  useEffect(() => {
    loadMentorProfile();
  }, [user]);

  const loadMentorProfile = async () => {
    if (!user) return;

    try {
      // Assuming GET /api/mentors/profile returns the profile for current user
      const { data } = await api.get('/mentors/profile');

      if (data) {
        setBio(data.bio || '');
        setSpecializations(data.specializations || []);
        setIsAvailable(data.is_available ?? true);
        setHourlyRate(data.hourly_rate || '');
      }
    } catch (error) {
      console.error('Error loading mentor profile:', error);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !specializations.includes(newSpecialization.trim())) {
      setSpecializations([...specializations, newSpecialization.trim()]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await api.put('/mentors/profile', {
        bio,
        specializations,
        is_available: isAvailable,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate.toString()) : null,
      });

      await updateProfile({ bio } as any);
      window.location.href = '/';
    } catch (error) {
      console.error('Error saving mentor profile:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = bio.trim().length > 0 && specializations.length > 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Mentor Profile</h1>
            <p className="text-gray-600">
              Help students find you by sharing your expertise and availability
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell students about your experience, teaching style, and what subjects you specialize in..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                  placeholder="e.g., Mathematics, Python, Web Development"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addSpecialization}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <div
                    key={spec}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                  >
                    <span>{spec}</span>
                    <button
                      onClick={() => removeSpecialization(spec)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isAvailable}
                      onChange={() => setIsAvailable(true)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Available</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isAvailable}
                      onChange={() => setIsAvailable(false)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Busy</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Profile Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Write a clear, welcoming bio to attract students</li>
                <li>• List your main areas of expertise</li>
                <li>• Indicate your hourly rate if applicable</li>
                <li>• Set your availability status to help students book sessions</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!isProfileComplete || loading}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
              >
                <span>{loading ? 'Saving...' : 'Complete Profile'}</span>
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
