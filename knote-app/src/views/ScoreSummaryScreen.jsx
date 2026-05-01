import React, { useState, useEffect } from 'react';
import Confetti from '../components/Confetti';
import { IconArrowRight } from '../components/Icons';
import { playSound } from '../lib/audio';
import { useAuth } from '../lib/auth.jsx';
import Button from '../components/Button';

const ScoreSummaryScreen = ({
    selectedRemedy,
    difficulty,
    levelScore,
    previousTotalScore,
    availableSymptomCount,
    onNextLevel,
    onNextRemedy,
    onFinish
}) => {
    const { displayName } = useAuth();
    const [animatedScore, setAnimatedScore] = useState(0);
    const [animationPhase, setAnimationPhase] = useState('level'); // 'level', 'adding', 'total'
    const [showConfetti, setShowConfetti] = useState(false);

    const newTotal = previousTotalScore + levelScore;
    const nextLevelName = difficulty === 'EASY' ? 'MEDIUM' : 'HARD';
    const hasNextLevel = difficulty !== 'HARD';
    const allLevelsComplete = difficulty === 'HARD';

    // Player Rank Logic
    const getRank = (score) => {
        if (score > 500) return { title: 'Master Healer', icon: '🧙‍♂️', color: 'text-purple-600' };
        if (score > 250) return { title: 'Lead Practitioner', icon: '👨‍⚕️', color: 'text-blue-600' };
        if (score > 100) return { title: 'Skilled Student', icon: '🎓', color: 'text-green-600' };
        return { title: 'Apprentice', icon: '🌱', color: 'text-amber-600' };
    };

    const rank = getRank(newTotal);

    // Animate score counting
    useEffect(() => {
        let timer;

        if (animationPhase === 'level') {
            const duration = 1500;
            const steps = Math.min(levelScore, 30);
            const stepValue = levelScore / steps;
            const stepTime = duration / steps;
            let current = 0;

            const animate = () => {
                current += stepValue;
                if (current >= levelScore) {
                    setAnimatedScore(levelScore);
                    timer = setTimeout(() => setAnimationPhase('adding'), 500);
                } else {
                    setAnimatedScore(Math.floor(current));
                    timer = setTimeout(animate, stepTime);
                    try { playSound('tick'); } catch (e) { }
                }
            };
            timer = setTimeout(animate, 300);
        } else if (animationPhase === 'adding') {
            timer = setTimeout(() => {
                setAnimationPhase('total');
                setShowConfetti(true);
                try { playSound('win'); } catch (e) { }
            }, 800);
        }

        return () => clearTimeout(timer);
    }, [animationPhase, levelScore]);

    const handleNextLevel = () => {
        try { playSound('tap'); } catch (e) { }
        onNextLevel(nextLevelName);
    };

    const handleFinish = () => {
        try { playSound('tap'); } catch (e) { }
        onFinish();
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 z-20 animate-fade-in relative overflow-hidden">
            {showConfetti && <Confetti />}

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-300 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            {/* Main card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-sm w-full text-center relative z-10 border border-white/50">

                {/* Ribbon / Header */}
                <div className={`inline-block px-4 py-1.5 rounded-full font-bold text-xs tracking-widest uppercase mb-4 shadow-sm border ${
                    allLevelsComplete
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                    {allLevelsComplete ? '🏆 All Levels Complete!' : 'Level Complete'}
                </div>

                <div className="mb-6">
                    <h2 className="text-gray-400 font-serif italic text-lg">Well done,</h2>
                    <h1 className="text-3xl font-extrabold text-gray-800 leading-tight">
                        {displayName || 'Player'}
                    </h1>
                </div>

                {/* Score Section */}
                <div className="relative mb-8">
                    {/* Level Score Bubble */}
                    <div className={`transition-all duration-700 ease-out transform ${animationPhase === 'level' ? 'scale-100 opacity-100' : 'scale-75 opacity-0 absolute inset-0'}`}>
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex flex-col items-center justify-center shadow-lg shadow-green-200 text-white animate-bounce-slow">
                            <span className="text-4xl font-black">+{animatedScore}</span>
                            <span className="text-xs font-bold opacity-90 uppercase">Points</span>
                        </div>
                    </div>

                    {/* Total Score Display */}
                    <div className={`transition-all duration-700 ${animationPhase === 'total' ? 'scale-100 opacity-100' : 'scale-90 opacity-0 absolute inset-0'}`}>
                        <div className="flex flex-col items-center">
                            <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 filter drop-shadow-sm leading-none tracking-tight">
                                {newTotal}
                            </div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Total Score</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-4">
                    {animationPhase === 'total' && hasNextLevel && (
                        <button
                            onClick={handleNextLevel}
                            className="group relative w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></span>
                            <div className="flex items-center justify-center gap-2">
                                <span>Play {nextLevelName} Level</span>
                                <IconArrowRight />
                            </div>
                        </button>
                    )}

                    {animationPhase === 'total' && (
                        <button
                            onClick={() => { try { playSound('tap'); } catch (e) { } onNextRemedy?.(); }}
                            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                allLevelsComplete
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                            }`}
                        >
                            Next Remedy
                            <IconArrowRight />
                        </button>
                    )}

                    {animationPhase === 'total' && (
                        <button
                            onClick={handleFinish}
                            className="w-full py-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 text-gray-400 hover:bg-gray-100"
                        >
                            Return Home
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoreSummaryScreen;
