import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Show splash for 2.5 seconds, then start fade out
        const timer = setTimeout(() => {
            setFadeOut(true);
            // Complete after fade animation
            setTimeout(onComplete, 500);
        }, 2500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[100] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        >
            {/* Logo Container */}
            <div className="animate-bounce-in">
                <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/20">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight animate-slide-up">
                Disney
            </h1>
            <p className="text-blue-200 text-lg font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Trophy & Gifts
            </p>

            {/* Loading Indicator */}
            <div className="mt-12 flex space-x-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            {/* Powered By */}
            <div className="absolute bottom-8 text-center">
                <p className="text-blue-300/60 text-xs">
                    powered by <span className="font-semibold text-blue-200/80">AstriOrb</span>
                </p>
            </div>
        </div>
    );
};

export default SplashScreen;
