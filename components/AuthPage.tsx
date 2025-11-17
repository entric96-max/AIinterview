import React, { useState, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile
} from "firebase/auth";
import { auth, googleProvider } from '../firebase';
import { Spinner } from './icons';
import type { AppView } from '../types';

const TermsContent = () => (
    <div className="space-y-4">
        <p>Welcome to AI Interview Proctor. By using our service, you agree to these terms.</p>
        <h3 className="font-bold text-slate-800 dark:text-white">1. Service Description</h3>
        <p>Our platform uses AI to conduct resume-based interviews and technical tests. Sessions are proctored using your camera and microphone to ensure integrity.</p>
        <h3 className="font-bold text-slate-800 dark:text-white">2. User Data</h3>
        <p>You grant us a license to use your uploaded resume and proctoring data (video/audio feeds) to provide and improve our services. This includes using anonymized data to train our AI models for generating more accurate and relevant interview questions.</p>
        <h3 className="font-bold text-slate-800 dark:text-white">3. User Responsibilities</h3>
        <p>You agree not to misuse the service, engage in cheating, or violate any laws. You are responsible for the accuracy of the information you provide in your resume.</p>
         <h3 className="font-bold text-slate-800 dark:text-white">4. Disclaimer</h3>
        <p>The service is provided "as is". We do not guarantee employment or interview success. The AI-generated questions are for practice and assessment purposes only.</p>
    </div>
);

const PrivacyContent = () => (
    <div className="space-y-4">
        <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
        <h3 className="font-bold text-slate-800 dark:text-white">1. Information We Collect</h3>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Account Information:</strong> Name, email, and password.</li>
            <li><strong>Resume Data:</strong> The content of the resume you upload.</li>
            <li><strong>Proctoring Data:</strong> Video and audio streams from your camera and microphone during interview sessions. We do not store these streams after the session ends; they are processed in real-time.</li>
            <li><strong>Usage Data:</strong> How you interact with our service.</li>
        </ul>
        <h3 className="font-bold text-slate-800 dark:text-white">2. How We Use Your Information</h3>
         <ul className="list-disc list-inside space-y-2">
            <li>To provide and personalize our services.</li>
            <li>To authenticate users and secure your account.</li>
            <li>To analyze your resume and generate relevant interview questions.</li>
            <li>To improve our AI models and service quality using anonymized and aggregated data. We will never use your personal data for model training without explicit anonymization.</li>
        </ul>
         <h3 className="font-bold text-slate-800 dark:text-white">3. Data Security</h3>
        <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
    </div>
);


interface AuthPageProps {
  setView: (view: AppView) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setView: setAppView }) => {
  const [view, setView] = useState<'login' | 'signup' | 'terms' | 'privacy'>('login');
  const [name, setName] = useState('');
  // Read the last logged-in email from localStorage on initial render.
  const [email, setEmail] = useState(() => localStorage.getItem('lastLoggedInEmail') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmailSentTo, setResetEmailSentTo] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    setSavedEmail(localStorage.getItem('lastLoggedInEmail'));
  }, []);

  const handleAuthAction = async (action: 'email' | 'google') => {
    setLoading(true);
    setError(null);
    setResetEmailSentTo(null);

    try {
        if (action === 'google') {
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user.email) {
                // On successful Google login, save the email to localStorage.
                localStorage.setItem('lastLoggedInEmail', result.user.email);
            }
        } else {
            if (view === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                // On successful email login, save the email to localStorage.
                localStorage.setItem('lastLoggedInEmail', email);
            } else {
                if(name.trim() === '') {
                    setError("Name is required for sign up.");
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (userCredential.user) {
                    await updateProfile(userCredential.user, { displayName: name });
                }
                // On successful sign-up, save the new email to localStorage.
                localStorage.setItem('lastLoggedInEmail', email);
            }
        }
    } catch (err: any) {
        switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                setError('Invalid email or password.');
                break;
            case 'auth/email-already-in-use':
                setError('This email is already registered. Please login.');
                break;
            case 'auth/weak-password':
                setError('Password should be at least 6 characters.');
                break;
            default:
                setError('An authentication error occurred. Please try again.');
        }
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
        setError("Please enter your email to reset your password.");
        return;
    }
    setLoading(true);
    setError(null);
    setResetEmailSentTo(null);
    try {
        await sendPasswordResetEmail(auth, email);
        setResetEmailSentTo(email);
    } catch (err: any) {
        console.error("Password Reset Error:", err);
        switch (err.code) {
            case 'auth/user-not-found':
                setError('No account found with this email address.');
                break;
            case 'auth/invalid-email':
                setError('Please enter a valid email address.');
                break;
            default:
                setError('Failed to send password reset email. Please try again.');
        }
    } finally {
        setLoading(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthAction('email');
  };
  
  const googleIconSvg = (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.4 294.6 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 381 248 381s150.5-67.7 150.5-150.5c0-14.7-2.1-29.3-6.1-43.5H248v-85.3h236.1c2.3 12.7 3.9 25.9 3.9 39.5z"></path>
    </svg>
  );

  const handleBackToAuth = () => {
    setError(null);
    setResetEmailSentTo(null);
    setView('login');
  };

  if (view === 'terms' || view === 'privacy') {
    const title = view === 'terms' ? 'Terms and Conditions' : 'Privacy Policy';
    const Content = view === 'terms' ? TermsContent : PrivacyContent;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-3xl w-full mx-auto p-8 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
           <header className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
              <button onClick={handleBackToAuth} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-lg font-semibold">
                  &larr; Back to Login
              </button>
           </header>
           <main className="overflow-y-auto text-slate-600 dark:text-slate-300">
               <Content />
           </main>
        </div>
      </div>
    );
  }

  const isLogin = view === 'login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <button onClick={() => setAppView('landing')} className="absolute top-4 left-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-semibold">
        &larr; Back to Home
      </button>
      <div className="max-w-md w-full mx-auto p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-2">
            {isLogin ? "Welcome Back!" : "Create an Account"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
            {isLogin ? "Sign in to continue." : "Let's get started."}
        </p>
        
        {error && <p className="bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}
        {resetEmailSentTo && (
          <p className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 p-3 rounded-md mb-4 text-center text-sm">
            Reset link sent to <strong>{resetEmailSentTo}</strong>. Check your inbox/spam.
          </p>
        )}

        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => { setView('login'); setError(null); setResetEmailSentTo(null); }}
            className={`w-1/2 py-3 text-base font-semibold transition-colors ${
              isLogin ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setView('signup'); setError(null); setResetEmailSentTo(null); }}
            className={`w-1/2 py-3 text-base font-semibold transition-colors ${
              !isLogin ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
            </div>
          )}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
                {isLogin && savedEmail && email === savedEmail && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Welcome back!{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('');
                                setSavedEmail(null);
                                // Also remove from localStorage so it doesn't reappear on refresh.
                                localStorage.removeItem('lastLoggedInEmail');
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Not you?
                        </button>
                    </span>
                )}
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Password</label>
                {isLogin && (<button type="button" onClick={handlePasswordReset} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Forgot Password?</button>)}
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600">
            {loading ? <Spinner /> : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="mx-4 text-xs text-slate-400 dark:text-slate-500">OR</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <button onClick={() => handleAuthAction('google')} disabled={loading} className="w-full flex justify-center items-center py-3 px-4 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-white font-semibold rounded-md transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 border border-slate-200 dark:border-slate-600">
            {loading ? <Spinner /> : <>{googleIconSvg} Sign in with Google</>}
        </button>

        <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500">
                By signing up, you agree to our{' '}
                <button type="button" onClick={() => setView('terms')} className="text-slate-600 dark:text-slate-400 hover:underline">Terms</button> and{' '}
                <button type="button" onClick={() => setView('privacy')} className="text-slate-600 dark:text-slate-400 hover:underline">Privacy Policy</button>.
            </p>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;