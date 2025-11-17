
import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import type { User, AppView, TerminationReason } from './types';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import ResumeInterviewPage from './components/ResumeInterviewPage';
import McqTestPage from './components/McqTestPage';
import { LogoutIcon, Spinner, SunIcon, MoonIcon } from './components/icons';
import { isApiKeyConfigured } from './services/geminiService';

type Theme = 'light' | 'dark';

const getInitialView = (): AppView => {
  const savedView = sessionStorage.getItem('appView');
  if (savedView === 'auth') return 'auth';
  return 'landing';
};

const TerminationPage: React.FC<{ message: string; onGoToDashboard: () => void }> = ({ message, onGoToDashboard }) => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">Interview Terminated</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mb-8">{message}</p>
        <button onClick={onGoToDashboard} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg">
            Return to Dashboard
        </button>
    </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(getInitialView);
  const [authLoading, setAuthLoading] = useState(true);
  const [terminationMessage, setTerminationMessage] = useState('');

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'light';
  });

  const [apiKeyStatus, setApiKeyStatus] = useState(false);

  useEffect(() => {
    setApiKeyStatus(isApiKeyConfigured());
  }, []);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleSetView = useCallback((newView: AppView) => {
    if (newView === 'auth') {
      sessionStorage.setItem('appView', newView);
    } else {
      sessionStorage.removeItem('appView');
    }
    setView(newView);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || 'User',
          email: firebaseUser.email || '',
        });
        sessionStorage.removeItem('appView');
        setView('dashboard');
      } else {
        setUser(null);
        setView(currentView => {
          if (currentView !== 'landing' && currentView !== 'auth') {
            return 'landing';
          }
          return currentView;
        });
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    sessionStorage.removeItem('appView');
  }, []);
  
  const toggleTheme = () => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleTerminate = useCallback((reason: TerminationReason, message: string) => {
    setTerminationMessage(message);
    handleSetView('terminated');
  }, [handleSetView]);

  const handleGoToDashboard = useCallback(() => {
    handleSetView('dashboard');
  }, [handleSetView]);

  const renderHeader = () => ( <header className="absolute top-0 right-0 p-4 z-30"><div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-md">{user && !authLoading && (<><span className="text-slate-700 dark:text-slate-300 font-medium text-sm pr-2 pl-3 hidden sm:block">{user.name}</span><span className="text-slate-700 dark:text-slate-300 font-medium text-sm pr-2 pl-3 sm:hidden">{user.name.split(' ')[0]}</span></>)}<button onClick={toggleTheme} className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 p-2 rounded-full transition-colors w-9 h-9" aria-label="Toggle theme">{theme === 'light' ? <MoonIcon className="w-5 h-5 text-slate-700" /> : <SunIcon className="w-5 h-5 text-slate-300" />}</button>{user && !authLoading && (<button onClick={handleLogout} className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 p-2 rounded-full transition-colors w-9 h-9" aria-label="Logout"><LogoutIcon className="w-5 h-5 text-slate-700 dark:text-slate-400" /></button>)}</div></header>);

  const renderContent = () => {
    if (authLoading) { return (<div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-900"><Spinner /><p className="mt-4 text-slate-600 dark:text-slate-400">Authenticating...</p></div>); }
    if (view === 'terminated') {
        return <TerminationPage message={terminationMessage} onGoToDashboard={handleGoToDashboard} />;
    }
    if (!user) {
        if (view === 'landing') return <LandingPage setView={handleSetView} />;
        return <AuthPage setView={handleSetView} />;
    }

    switch (view) {
      case 'dashboard':
        return <DashboardPage username={user.name} setView={handleSetView} isApiKeyConfigured={apiKeyStatus} />;
      case 'resume-interview':
        return <ResumeInterviewPage onTerminate={handleTerminate} onEndSession={handleGoToDashboard} />;
      case 'mcq-test':
        return <McqTestPage onEndSession={handleGoToDashboard} />;
      default:
         return <DashboardPage username={user.name} setView={handleSetView} isApiKeyConfigured={apiKeyStatus} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white relative min-h-screen transition-colors duration-300">
      {renderHeader()}
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;