import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AiIcon, CheckIcon, DocumentTextIcon, ClipboardListIcon } from './icons';

const steps = [
  { text: "Upload your resume...", visual: 'upload', duration: 2500 },
  { text: "AI analyzes skills & experience...", visual: 'analysis', duration: 3000 },
  { text: "Generates personalized questions...", visual: 'questions', duration: 2500 },
  { text: "Proctored interview begins...", visual: 'proctoring', duration: 3500 },
  { text: "AI evaluates your answers...", visual: 'results', duration: 3000 },
  { text: "Demo complete!", visual: 'done', duration: 2000 },
];

// --- Visual Components for Each Step ---
const UploadVisual = () => <div className="animate-fade-in-up"><DocumentTextIcon className="w-16 h-16 text-indigo-400" /></div>;
const AnalysisVisual = () => <div className="animate-pulse animate-fade-in-up"><AiIcon className="w-16 h-16 text-indigo-400" /></div>;
const QuestionsVisual = () => <div className="animate-fade-in-up"><ClipboardListIcon className="w-16 h-16 text-indigo-400" /></div>;
const ProctoringVisual = () => (
    <div className="w-48 h-32 bg-slate-200 dark:bg-slate-700/50 rounded-lg p-2 flex flex-col animate-fade-in-up relative border border-slate-300 dark:border-slate-600">
        <div className="w-16 h-12 bg-slate-500 dark:bg-slate-800 rounded absolute top-3 left-3 border-2 border-slate-300 dark:border-slate-600"></div>
        <div className="w-full h-3 bg-slate-400/80 dark:bg-slate-500/80 rounded mt-auto mb-1"></div>
        <div className="w-3/4 h-3 bg-slate-400/80 dark:bg-slate-500/80 rounded mb-1"></div>
        <div className="flex items-center space-x-1.5 absolute bottom-2 right-2 bg-slate-100/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">REC</span>
        </div>
    </div>
);
const ResultsVisual = () => (
    <div className="w-48 h-32 flex items-center justify-center space-x-4 animate-fade-in-up">
        <div className="relative w-16 h-16">
            <svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-slate-300 dark:text-slate-600" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className="text-green-500" stroke="currentColor" strokeWidth="3" strokeDasharray="85, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">85%</span>
        </div>
        <div className="flex items-end h-16 space-x-1.5">
            <div className="w-3 bg-green-500 rounded-t-sm animate-fade-in-up" style={{height: '60%', animationDelay: '0.1s'}}></div>
            <div className="w-3 bg-yellow-500 rounded-t-sm animate-fade-in-up" style={{height: '40%', animationDelay: '0.2s'}}></div>
            <div className="w-3 bg-green-500 rounded-t-sm animate-fade-in-up" style={{height: '80%', animationDelay: '0.3s'}}></div>
        </div>
    </div>
);
const DoneVisual = () => <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-fade-in-up"><CheckIcon className="w-12 h-12 text-green-400" /></div>;


const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }
    const stepTimeouts = steps.map((step, index) => {
        const delay = steps.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
        return setTimeout(() => {
            setCurrentStep(index);
        }, delay);
    });

    return () => stepTimeouts.forEach(clearTimeout);
  }, [isOpen]);
  
  const renderVisual = () => {
    const visualKey = steps[currentStep]?.visual;
    switch (visualKey) {
        case 'upload': return <UploadVisual />;
        case 'analysis': return <AnalysisVisual />;
        case 'questions': return <QuestionsVisual />;
        case 'proctoring': return <ProctoringVisual />;
        case 'results': return <ResultsVisual />;
        case 'done': return <DoneVisual />;
        default: return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Platform Demo">
        <div className="flex flex-col items-center text-center p-4">
            <div className="w-48 h-32 flex items-center justify-center mb-6">
                {renderVisual()}
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 h-12 flex items-center">
                {steps[currentStep].text}
            </h3>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 relative overflow-hidden">
                <div
                    key={currentStep} // Re-trigger animation on step change
                    className="bg-indigo-500 h-2.5 rounded-full"
                    style={{ animation: `progress-bar ${steps[currentStep].duration}ms linear forwards` }}
                ></div>
                <style>{`
                    @keyframes progress-bar {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                `}</style>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                This is a quick simulation of our AI interview process.
            </p>
             <button onClick={onClose} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Close
            </button>
        </div>
    </Modal>
  );
};

export default DemoModal;
