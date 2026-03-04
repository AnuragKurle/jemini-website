import React, { useMemo } from 'react';
import { playSound } from '../lib/audio';
import { useAuth } from '../lib/auth.jsx';
import Button from '../components/Button.jsx';
import MiniLeaderboard from '../components/MiniLeaderboard.jsx';

const HomeView = ({ setView }) => {
    const { levelsCompleted, displayName, currentUser } = useAuth();

    // Get personalized name: displayName first, then first part of email
    const playerName = useMemo(() => {
        if (displayName && displayName.trim()) {
            return displayName.trim();
        }
        if (currentUser?.email) {
            // Extract the part before @ from email
            const emailPart = currentUser.email.split('@')[0];
            // Capitalize first letter
            return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
        }
        return null;
    }, [displayName, currentUser?.email]);

    // Calculate user's score
    const userScore = useMemo(() => {
        if (!levelsCompleted || levelsCompleted.length === 0) return 0;

        const levelMap = new Map();
        levelsCompleted.forEach(level => {
            if (level && level.remedy && level.difficulty) {
                const key = `${level.remedy}-${level.difficulty}`;
                if (!levelMap.has(key)) {
                    levelMap.set(key, level);
                }
            }
        });

        let totalPoints = 0;
        levelMap.forEach(level => {
            // Check for new format with totalPoints
            if (level.totalPoints) {
                totalPoints += level.totalPoints;
            } else {
                const points = level.difficulty === 'HARD' ? 60 : level.difficulty === 'MEDIUM' ? 28 : 12;
                totalPoints += points;
            }
        });

        return totalPoints;
    }, [levelsCompleted]);

    const uniqueLevelsCompleted = useMemo(() => {
        if (!levelsCompleted || levelsCompleted.length === 0) return 0;
        const levelMap = new Map();
        levelsCompleted.forEach(level => {
            if (level && level.remedy && level.difficulty) {
                const key = `${level.remedy}-${level.difficulty}`;
                levelMap.set(key, level);
            }
        });
        return levelMap.size;
    }, [levelsCompleted]);

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-5 sm:space-y-8 animate-fade-in relative z-20 p-4 pt-16">

            {/* Personalized Welcome Message - Stagger 1 */}
            {playerName && (
                <div className="text-center animate-fade-in stagger-1">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-700">
                        <span className="mr-2 inline-block animate-wave">👋</span>
                        Welcome, <span className="text-purple-600 font-bold">{playerName}</span>!
                    </p>
                </div>
            )}

            {/* Logo Circle - Floating Animation */}
            <div className="glass-premium p-8 rounded-full flex flex-col items-center justify-center w-44 h-44 sm:w-56 sm:h-56 z-10 relative overflow-hidden animate-float stagger-1 transition-all duration-700 active:scale-[0.98]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-20"></div>
                <img
                    src="/logo.png"
                    alt="Knote Logo"
                    className="h-16 sm:h-20 w-auto object-contain relative z-10 mix-blend-multiply animate-fade-in"
                />
            </div>
            <p className="text-sm text-gray-600 font-bold tracking-wide animate-fade-in stagger-2">A materia medica game</p>

            {/* Main Action Area */}
            <div className="flex flex-col items-center gap-8 w-full max-w-sm animate-fade-in stagger-2">

                {/* Play Button */}
                <div className="relative group">
                    {/* Glow effect behind button */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                    <Button
                        variant="hero"
                        size="xl"
                        onClick={() => {
                            playSound('tap');
                            setView('remedies');
                        }}
                        className="animate-pulse-slow relative w-full px-12 py-4 text-xl tracking-widest hover:scale-105 active:scale-95 transition-all duration-500 ease-out shadow-xl hover:shadow-2xl"
                    >
                        PLAY
                    </Button>
                </div>

                {/* Score & Rank Link (Minimalist) */}
                {userScore > 0 && (
                    <div
                        className="flex flex-col items-center text-center space-y-2 text-gray-500 hover:text-gray-800 transition-colors duration-300 cursor-pointer group"
                        onClick={() => {
                            playSound('tap');
                            setView('scoreboard');
                        }}
                    >
                        <div className="text-sm font-medium flex items-center gap-2">
                            <span>Your current score: <span className="text-purple-600 font-bold">{userScore}</span></span>
                            <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 text-purple-600">→</span>
                        </div>
                    </div>
                )}

                {/* Motivational message for new players */}
                {userScore === 0 && (
                    <div className="text-center text-gray-500 text-sm max-w-xs animate-fade-in stagger-3">
                        <p className="font-medium opacity-80">Complete levels to earn points & climb ranks</p>
                    </div>
                )}

                {/* Mini Leaderboard - Subtle placement */}
                <div className="w-full transform transition-all duration-500 hover:-translate-y-1">
                    <MiniLeaderboard onViewFull={() => setView('scoreboard')} />
                </div>
            </div>

        </div>
    );
};

export default HomeView;
