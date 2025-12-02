import { AuthProvider } from './contexts/AuthContext';
import Router from './components/Router';
import { useEffect } from 'react';
import { registerServiceWorker, checkOnlineStatus, setupPWAInstallPrompt, requestPersistentStorage } from './utils/pwa';

function App() {
  useEffect(() => {
    registerServiceWorker();
    checkOnlineStatus();
    setupPWAInstallPrompt();
    requestPersistentStorage();
  }, []);

  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
