import React from 'react';

const LoadingAnimation = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8 relative z-20 p-4">
            <style>{`
                @keyframes fadeSlideUp {
                    0% {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: scale(1.15);
                        opacity: 1;
                    }
                }
                .animate-logo-bg {
                    animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    animation-delay: 0s;
                    opacity: 0;
                }
                .animate-k {
                    animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    animation-delay: 0.2s;
                    opacity: 0;
                }
                .animate-note {
                    animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    animation-delay: 0.5s;
                    opacity: 0;
                }
                .animate-tagline {
                    animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    animation-delay: 0.9s;
                    opacity: 0;
                }
                .dot-pulse {
                    animation: pulse 1.2s ease-in-out infinite;
                }
                .dot-pulse-1 { animation-delay: 0s; }
                .dot-pulse-2 { animation-delay: 0.2s; }
                .dot-pulse-3 { animation-delay: 0.4s; }
            `}</style>

            {/* Logo circle - matches HomeView */}
            <div className="animate-logo-bg bg-white p-8 rounded-full shadow-2xl flex flex-col items-center justify-center w-40 h-40 z-10 border-4 border-blue-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-20"></div>
                <img
                    src="/logo.png"
                    alt="Knote Logo"
                    className="h-16 w-auto object-contain relative z-10 animate-fade-in mix-blend-multiply"
                />
            </div>

            {/* Tagline and loading dots - placeholder for where login form will be */}
            <div className="w-full max-w-sm text-center">
                <p className="animate-tagline text-sm text-gray-600 font-medium tracking-wide">
                    a materia medica game
                </p>

                {/* Loading indicator */}
                <div className="mt-6 flex gap-2 justify-center">
                    <div className="dot-pulse dot-pulse-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="dot-pulse dot-pulse-2 w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="dot-pulse dot-pulse-3 w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation;
