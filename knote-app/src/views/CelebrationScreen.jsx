import React, { useMemo } from 'react';
import Confetti from '../components/Confetti';
import { IconArrowRight } from '../components/Icons';
import { playSound } from '../lib/audio';
import Button from '../components/Button';

const CelebrationScreen = ({ selectedRemedy, difficulty, time, formatTime, onContinue, cards }) => {
    const uniqueImages = useMemo(() => {
        const seen = new Set();
        return (cards || []).filter(card => {
            if (card.content?.startsWith('http') && !seen.has(card.content)) {
                seen.add(card.content);
                return true;
            }
            return false;
        });
    }, [cards]);
    // Calculate score preview based on difficulty
    const getScorePreview = () => {
        switch (difficulty) {
            case 'HARD': return { pairs: 20, pointsPerSymptom: 3, baseTotal: 60 };
            case 'MEDIUM': return { pairs: 14, pointsPerSymptom: 2, baseTotal: 28 };
            case 'EASY':
            default: return { pairs: 6, pointsPerSymptom: 2, baseTotal: 12 };
        }
    };

    const scoreInfo = getScorePreview();

    const handleContinue = () => {
        try {
            playSound('tap');
        } catch (err) {
            console.warn('Sound failed to play:', err);
        }
        onContinue();
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 z-20 animate-scale-in relative">
            {/* Hidden preloader — warms up all recap images while user reads this screen */}
            <div className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {uniqueImages.map(card => <img key={card.id} src={card.content} alt="" />)}
            </div>
            <Confetti />

            {/* Star burst background effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="w-[150%] h-[150%] animate-spin-slow opacity-10">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-2 h-[60%] bg-gradient-to-t from-yellow-400 to-transparent origin-bottom"
                            style={{ transform: `rotate(${i * 30}deg) translateX(-50%)` }}
                        />
                    ))}
                </div>
            </div>

            {/* Main content card */}
            <div className="glass-premium rounded-3xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center relative z-10 border-4 border-yellow-300">
                {/* Trophy icon */}
                <div className="text-7xl sm:text-8xl mb-4 animate-bounce-slow">🏆</div>

                {/* Level Complete text */}
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 mb-2">
                    Level Complete!
                </h1>

                {/* Remedy & Difficulty */}
                <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-green-600 uppercase">{selectedRemedy}</h2>
                    <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {difficulty} Mode
                    </span>
                </div>

                {/* Stats row */}
                <div className="flex justify-center gap-4 mb-6">
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">⏱️ {formatTime(time)}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Time</div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">✓ {scoreInfo.pairs}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Matches</div>
                    </div>
                </div>

                {/* Score preview teaser */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border border-yellow-200">
                    <p className="text-sm text-gray-600 mb-1">Points to collect:</p>
                    <div className="text-3xl font-bold text-orange-500">
                        +{scoreInfo.baseTotal} pts
                    </div>
                </div>

                {/* Continue button */}
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleContinue}
                    className="rounded-full border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                    isFullWidth
                >
                    See Your Rewards <IconArrowRight />
                </Button>
            </div>
        </div>
    );
};

export default CelebrationScreen;
