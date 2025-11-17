
import React, { useState } from 'react';
import type { AppView } from '../types';
import InstructionModal from './InstructionModal';

interface DashboardPageProps {
  username: string;
  setView: (view: AppView) => void;
  isApiKeyConfigured: boolean;
}

const ApiWarningBanner: React.FC = () => (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 bg-yellow-400/20 border border-yellow-500/30 rounded-lg text-center shadow-lg">
        <p className="font-semibold text-yellow-800 dark:text-yellow-300">You are in Demo Mode.</p>
        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            To connect to the live AI, create a <code className="bg-yellow-200/50 dark:bg-yellow-800/50 px-1 py-0.5 rounded font-mono text-xs">.env</code> file in your project's root directory and add your Gemini API key: <code className="bg-yellow-200/50 dark:bg-yellow-800/50 px-1 py-0.5 rounded font-mono text-xs">API_KEY=your_key_here</code>, then restart the server.
        </p>
    </div>
);

const resumeInstructions = [
    "Ensure your camera and microphone are enabled and working.",
    "Find a quiet, well-lit environment to avoid distractions.",
    "The session will be recorded for proctoring purposes.",
    "Speak clearly into your microphone when answering questions.",
    "You cannot end the interview until all questions are answered."
];

const mcqInstructions = [
    "Ensure your camera and microphone are enabled and working.",
    "This is a timed test. Make sure your internet connection is stable.",
    "The session will be recorded for proctoring purposes.",
    "Once you submit an answer, you cannot go back.",
    "Read each question carefully before selecting an answer."
];


const DashboardPage: React.FC<DashboardPageProps> = ({ username, setView, isApiKeyConfigured }) => {
  const [instructionModal, setInstructionModal] = useState<'resume' | 'mcq' | null>(null);

  const handleStartInterview = () => {
    if (instructionModal === 'resume') {
        setView('resume-interview');
    } else if (instructionModal === 'mcq') {
        setView('mcq-test');
    }
    setInstructionModal(null);
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      {!isApiKeyConfigured && <ApiWarningBanner />}
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">Welcome, {username}!</h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mt-2">Choose your interview path.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div
          style={{ animationDelay: '0.2s' }}
          onClick={() => setInstructionModal('resume')}
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-8 rounded-2xl border border-slate-200 dark:border-slate-700 w-80 cursor-pointer group hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-2xl animate-fade-in-up"
        >
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Resume Based Interview</h2>
          <p className="text-slate-600 dark:text-slate-400">Our AI will analyze your resume and ask you tailored questions to assess your skills and experience.</p>
        </div>
        <div
          style={{ animationDelay: '0.4s' }}
          onClick={() => setInstructionModal('mcq')}
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-8 rounded-2xl border border-slate-200 dark:border-slate-700 w-80 cursor-pointer group hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-2xl animate-fade-in-up"
        >
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">MCQ Practice Test</h2>
          <p className="text-slate-600 dark:text-slate-400">Test your knowledge in various technical subjects with our AI-generated multiple-choice questions.</p>
        </div>
      </div>
      
      <InstructionModal
        isOpen={instructionModal !== null}
        onClose={() => setInstructionModal(null)}
        onConfirm={handleStartInterview}
        title={instructionModal === 'resume' ? "Resume Interview Instructions" : "MCQ Test Instructions"}
        instructions={instructionModal === 'resume' ? resumeInstructions : mcqInstructions}
      />
    </div>
  );
};

export default DashboardPage;