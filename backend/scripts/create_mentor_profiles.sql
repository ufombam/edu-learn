-- Create mentor_profiles table
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  specializations text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  hourly_rate decimal(10, 2),
  rating_average decimal(3, 2) DEFAULT 0,
  total_sessions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_available ON mentor_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_rating ON mentor_profiles(rating_average DESC);

COMMENT ON TABLE mentor_profiles IS 'Stores mentor-specific profile information';
