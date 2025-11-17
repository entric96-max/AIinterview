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

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 5 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 20000);
        };

        const interval = setInterval(createParticle, 200);

        return () => clearInterval(interval);
    }, []);

    return <div id="particle-container" className="absolute inset-0 overflow-hidden"></div>;
};


const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
    const [isDemoOpen, setIsDemoOpen] = useState(false);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
            <ParticleBackground />
            <div className="text-center z-10 animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
                    <span className="animate-gradient bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                        AI Interview Proctor
                    </span>
                </h1>
                <p style={{ animationDelay: '0.2s' }} className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl animate-fade-in-up">
                    Your personal AI-powered co-pilot to ace technical interviews and land your dream job.
                </p>
                <div style={{ animationDelay: '0.4s' }} className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
                    <button
                        onClick={() => setView('auth')}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Login / Sign Up
                    </button>
                    <button
                        onClick={() => setIsDemoOpen(true)}
                        className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        Watch Demo
                    </button>
                </div>
            </div>
            <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
        </div>
    );
};

export default LandingPage;
