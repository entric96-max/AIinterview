import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Spinner, CloseIcon } from './icons'; // Assuming AiIcon and CheckIcon are in icons.tsx

const AiIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


const steps = [
  { text: "Upload your resume (PDF, DOCX...)", duration: 2000 },
  { text: "AI analyzes your skills & experience...", duration: 3000 },
  { text: "Generates personalized questions...", duration: 2500 },
  { text: "Interview starts under proctoring.", duration: 2000 },
  { text: "Demo complete!", duration: 1500 },
];

const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const runDemo = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        // Animate progress bar for the duration of the step
        const startTime = Date.now();
        let frameId: number;
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progressPercentage = Math.min((elapsed / steps[i].duration) * 100, 100);
          setProgress(progressPercentage);
          if (elapsed < steps[i].duration) {
            frameId = requestAnimationFrame(animate);
          }
        };
        frameId = requestAnimationFrame(animate);
        
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        cancelAnimationFrame(frameId);
      }
    };
    
    runDemo();

  }, [isOpen]);

  const Icon = currentStep < 3 ? AiIcon : CheckIcon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Platform Demo">
        <div className="flex flex-col items-center text-center p-4">
            <div className="relative w-24 h-24 mb-6">
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${currentStep === steps.length -1 ? 'opacity-0' : 'opacity-100'}`}>
                    <Spinner />
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${currentStep === steps.length - 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckIcon className="w-12 h-12 text-green-400" />
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-100 dark:text-white mb-4 h-14 flex items-center">
                {steps[currentStep].text}
            </h3>

            <div className="w-full bg-slate-600 dark:bg-slate-700 rounded-full h-2.5 mb-4">
                <div
                    className="bg-indigo-500 h-2.5 rounded-full"
                    style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                ></div>
            </div>

            <p className="text-sm text-slate-400 dark:text-slate-500">
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
