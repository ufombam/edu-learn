# LearnHub - Remote Learning Platform

A comprehensive Progressive Web App (PWA) designed specifically for underserved students in Nigeria, featuring offline functionality, low-bandwidth optimization, and accessible learning experiences.

## Features

### Core Functionality
- **Authentication System** - Secure email/password authentication with role-based access control
- **Student Dashboard** - Personalized learning dashboard with progress tracking and analytics
- **Course Catalog** - Browse and enroll in courses across multiple categories
- **Learning Management** - Structured lessons with video, text, PDF, and quiz content
- **Mentorship System** - Connect with mentors and book one-on-one sessions
- **Real-time Chat** - Live messaging with mentors and study groups using Supabase Realtime
- **Admin Dashboard** - Content and user management for administrators

### Progressive Web App Features
- **Offline Support** - Service workers cache critical assets for offline access
- **Low Bandwidth Mode** - Optimized for 2G/3G connections with compressed assets
- **Installable** - Can be installed on mobile devices as a native-like app
- **Background Sync** - Automatic data synchronization when connection is restored
- **Push Notifications** - Stay updated with course deadlines and mentor messages

### Accessibility & Localization
- **Multi-language Support** - English, Hausa, Yoruba, and Igbo
- **Mobile-first Design** - Optimized for low-cost smartphones
- **Responsive Layout** - Works seamlessly across all screen sizes
- **High Contrast Mode** - Better visibility for users with visual impairments

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Service Workers for PWA functionality

### Backend & Database
- Supabase (PostgreSQL)
- Supabase Realtime for live chat
- Row Level Security (RLS) for data protection
- Edge Functions for serverless operations

### Media & Communication
- WebRTC for video calling capabilities
- File upload and management system
- Image compression for low bandwidth

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   └── Router.tsx      # Client-side routing
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── lib/                # Core libraries
│   ├── supabase.ts    # Supabase client
│   └── database.types.ts # TypeScript types
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   ├── student/       # Student dashboard
│   ├── courses/       # Course catalog and details
│   ├── lessons/       # Lesson viewer
│   ├── mentors/       # Mentor directory
│   ├── chat/          # Real-time messaging
│   ├── profile/       # User profile
│   └── admin/         # Admin dashboard
├── utils/             # Utility functions
│   ├── pwa.ts         # PWA utilities
│   ├── videoCall.ts   # Video calling utilities
│   └── fileManager.ts # File management utilities
└── App.tsx            # Root component
```

## Database Schema

### Main Tables
- **profiles** - Extended user information
- **courses** - Course catalog
- **lessons** - Course content modules
- **course_enrollments** - Student course registrations
- **lesson_progress** - Individual lesson completion tracking
- **mentor_profiles** - Mentor information and availability
- **mentor_sessions** - Scheduled mentoring sessions
- **chat_conversations** - Chat threads
- **chat_messages** - Individual messages
- **notifications** - User notifications
- **offline_content** - Downloaded content tracking
- **sync_queue** - Offline data synchronization queue

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. The database migrations have already been applied. If you need to reapply them, use the Supabase dashboard.

6. Start the development server:
```bash
npm run dev
```

7. Build for production:
```bash
npm run build
```

## User Roles

### Student
- Browse and enroll in courses
- Track learning progress
- Book mentor sessions
- Participate in chat conversations
- Download content for offline access

### Mentor
- View scheduled sessions with students
- Participate in video/chat sessions
- Provide guidance and support
- Manage availability and profile

### Admin
- Manage users and roles
- Create and publish courses
- Add lessons and content
- Monitor platform analytics
- Moderate content

## PWA Installation

### On Mobile Devices
1. Open the website in a mobile browser
2. Look for "Add to Home Screen" prompt
3. Click "Add" or "Install"
4. Access the app from your home screen

### On Desktop
1. Open the website in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install" in the popup
4. Access the app from your desktop

## Offline Functionality

The platform automatically caches:
- Application shell (HTML, CSS, JS)
- Course thumbnails and content
- User profile data
- Recent messages

When offline:
- Browse cached courses and lessons
- View downloaded content
- Take quizzes (synced when online)
- Compose messages (sent when online)

## Low Bandwidth Optimization

Enable low bandwidth mode in profile settings to:
- Compress images to WebP format
- Reduce video quality automatically
- Limit real-time sync frequency
- Minimize data transfer

## Security Features

- JWT-based authentication
- Row Level Security (RLS) on all tables
- Secure session management
- Input validation and sanitization
- XSS and CSRF protection
- Encrypted communication

## Performance Targets

- First load: < 3 seconds on 3G
- Time to interactive: < 5 seconds
- Lighthouse score: > 90
- Bundle size: < 500KB (gzipped)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run typecheck # TypeScript type checking
```

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- Mobile-first responsive design
- Accessibility best practices

## Deployment

### Recommended Platforms
- Vercel (automatic deployment from Git)
- Netlify (supports PWA out of the box)
- Firebase Hosting (good PWA support)

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

## Future Enhancements

- [ ] Video recording for mentor sessions
- [ ] AI-powered course recommendations
- [ ] Gamification with badges and leaderboards
- [ ] Community forums
- [ ] Mobile app (React Native)
- [ ] SMS notifications for low-data users
- [ ] USSD integration for feature phones
- [ ] Offline video playback
- [ ] Payment integration for premium courses

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact support team
- Check documentation

## Acknowledgments

Built with modern web technologies to serve underserved students in Nigeria and beyond, making quality education accessible to all regardless of connectivity constraints.
