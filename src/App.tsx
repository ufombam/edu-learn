import { AuthProvider } from './contexts/AuthContext';
import Router from './components/Router';
import { useEffect } from 'react';
import { registerServiceWorker, checkOnlineStatus, setupPWAInstallPrompt, requestPersistentStorage } from './utils/pwa';
import { syncPendingAttempts } from './services/quizService';

function App() {
  useEffect(() => {
    registerServiceWorker();
    checkOnlineStatus();
    setupPWAInstallPrompt();
    requestPersistentStorage();

    // Sync pending quizzes when app starts
    syncPendingAttempts();

    // Listen for online status to sync
    const handleOnline = () => {
      console.log('App is back online, syncing quizzes...');
      syncPendingAttempts();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
