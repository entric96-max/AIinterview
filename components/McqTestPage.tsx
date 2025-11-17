import React, { useState, useEffect } from 'react';
import type { MCQ, TechnicalSubject } from '../types';
import { generateMcqTest } from '../services/geminiService';
import ProctoringView from './ProctoringView';
import { Spinner } from './icons';

type ProctoringStatus = 'pending' | 'ready' | 'error';

const subjects: TechnicalSubject[] = ["DBMS", "CN", "OOPS", "DSA", "OS", "C++"];

const McqTestPage: React.FC<{ onEndSession: () => void }> = ({ onEndSession }) => {
  const [selectedSubject, setSelectedSubject] = useState<TechnicalSubject | null>(null);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus>('pending');
  const [proctoringError, setProctoringError] = useState<string>('');

  useEffect(() => {
    if (selectedSubject && !isLoading) {
      const fetchQuestions = async () => {
        setIsLoading(true);
        const fetchedQuestions = await generateMcqTest(selectedSubject);
        setQuestions(fetchedQuestions);
        setUserAnswers(new Array(fetchedQuestions.length).fill(''));
        setIsLoading(false);
      };
      fetchQuestions();
    }
  }, [selectedSubject]);

  const handleSelectAnswer = (option: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      let correctAnswers = 0;
      questions.forEach((q, index) => {
        if (q.correctAnswer === userAnswers[index]) {
          correctAnswers++;
        }
      });
      setScore(correctAnswers);
      setShowResults(true);
    }
  };

  const renderInterviewContent = () => {
    if (showResults) {
      const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
      const resultColor = percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500';

      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-8 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md text-center">
              <h1 className="text-4xl font-bold mb-2">Test Results</h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">Subject: {selectedSubject}</p>
              <div className={`text-7xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${percentage >= 70 ? 'from-green-400 to-emerald-600' : percentage >= 40 ? 'from-yellow-400 to-amber-600' : 'from-red-400 to-rose-600'}`}>
                  {score}
                  <span className="text-4xl text-slate-500 dark:text-slate-400"> / {questions.length}</span>
              </div>
              <p className={`text-2xl font-semibold mb-8 ${resultColor}`}>({percentage.toFixed(0)}%)</p>
              <button onClick={onEndSession} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                Back to Dashboard
              </button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
          <Spinner />
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">Generating {selectedSubject} questions...</p>
        </div>
      );
    }

    if (!selectedSubject || questions.length === 0) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">MCQ Practice Test</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">Select a subject to begin.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {subjects.map(subject => (
              <button key={subject} onClick={() => setSelectedSubject(subject)} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-8 rounded-lg text-slate-800 dark:text-white text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl">
                {subject}
              </button>
            ))}
          </div>
          <button onClick={onEndSession} className="mt-12 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              Back to Dashboard
          </button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-lg p-8 shadow-2xl">
          <p className="text-slate-500 dark:text-slate-400 mb-2 font-medium">Question {currentQuestionIndex + 1} of {questions.length} - {selectedSubject}</p>
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h2>
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                className={`block w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                  userAnswers[currentQuestionIndex] === option
                    ? 'bg-indigo-600 border-indigo-500 text-white font-semibold ring-2 ring-indigo-400'
                    : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-200/80 dark:hover:bg-slate-600/80'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button 
              onClick={handleNextQuestion} 
              disabled={!userAnswers[currentQuestionIndex]}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'}
          </button>
        </div>
      </div>
    );
  };
  
  if (proctoringStatus === 'pending') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <Spinner />
        <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">Waiting for camera & microphone permissions...</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Please check your browser for a permission prompt.</p>
        {/* Render ProctoringView hidden to trigger permission request */}
        <div className="opacity-0 invisible absolute">
          <ProctoringView
            onReady={() => setProctoringStatus('ready')}
            onError={(err) => { setProctoringStatus('error'); setProctoringError(err); }}
          />
        </div>
      </div>
    );
  }

  if (proctoringStatus === 'error') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Permission Error</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mb-6">{proctoringError}</p>
        <button onClick={onEndSession} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {renderInterviewContent()}
      <ProctoringView 
        onReady={() => {}} 
        onError={(err) => { setProctoringStatus('error'); setProctoringError(err); }} 
      />
    </>
  );
};

export default McqTestPage;