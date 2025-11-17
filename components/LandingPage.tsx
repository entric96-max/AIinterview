import React, { useEffect, useState } from 'react';
import type { AppView } from '../types';
import DemoModal from './DemoModal';

interface LandingPageProps {
  setView: (view: AppView) => void;
}

const ParticleBackground: React.FC = () => {
  useEffect(() => {
    const container = document.getElementById('particle-container');
    if (!container) return;

    // To prevent spamming particles on re-renders, check if particles already exist.
    if (container.childElementCount > 0) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 5 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 10 + 8}s`; // Slower, more subtle
      particle.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(particle);

      // Clean up the particle after its animation is complete
      setTimeout(() => {
        particle.remove();
      }, 18000); 
    };

    const intervalId = setInterval(createParticle, 250); // Create particles less frequently

    // Cleanup function to clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return <div id="particle-container" className="absolute inset-0 -z-10 overflow-hidden" />;
};


const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <>
      <ParticleBackground />
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 relative z-10">
        <div className="max-w-3xl animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-gradient">
            AI Interview Proctor
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Ace your next technical interview. Get personalized, resume-based questions and practice under proctored conditions with real-time AI feedback.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => setView('auth')}
              className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300"
            >
              Login / Sign Up
            </button>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-8 py-3 text-lg font-semibold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-800 transform hover:scale-105 transition-all duration-300"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </div>
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
};

export default LandingPage;