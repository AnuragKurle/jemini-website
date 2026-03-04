import React, { useState, useEffect } from 'react';
import { playSound } from '../lib/audio';
import { getSymptomCount } from '../lib/data';
import { db } from '../lib/firebase';
import Button from '../components/Button';

const DifficultyView = ({ setView, selectedRemedy, shuffleCards }) => {
    const [difficultyInfo, setDifficultyInfo] = useState({ easy: false, medium: false, hard: false, count: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDifficultyInfo();
    }, [selectedRemedy]);

    const loadDifficultyInfo = async () => {
        setLoading(true);
        try {
            const info = await getSymptomCount(selectedRemedy, db);
            setDifficultyInfo(info);
        } catch (err) {
            console.error('Failed to load symptom count:', err);
            setDifficultyInfo({ easy: false, medium: false, hard: false, count: 0 });
        } finally {
            setLoading(false);
        }
    };

    const levelConfig = {
        'EASY': { icon: '🌟', colorName: 'green', border: 'border-green-700', pairs: 6, required: 4, countKey: 'easyCount' },
        'MEDIUM': { icon: '⭐', colorName: 'blue', border: 'border-blue-700', pairs: 14, required: 4, countKey: 'mediumCount' },
        'HARD': { icon: '🔥', colorName: 'purple', border: 'border-purple-700', pairs: 20, required: 4, countKey: 'hardCount' }
    };

    const isLevelEnabled = (level) => {
        if (level === 'EASY') return difficultyInfo.easy;
        if (level === 'MEDIUM') return difficultyInfo.medium;
        if (level === 'HARD') return difficultyInfo.hard;
        return false;
    };

    return (
        <div className="w-full h-full p-4 z-20 flex flex-col items-center justify-center overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="pb-3 text-center">
                <h2 className="text-3xl sm:text-4xl font-serif text-red-500 font-bold">K<span className="text-black font-handwriting font-normal">note</span></h2>
                <h3 className="text-xl sm:text-2xl font-bold text-green-600 uppercase tracking-widest mt-2 drop-shadow-sm">{selectedRemedy}</h3>
            </div>

            {/* Level Buttons */}
            <div className="space-y-4 w-full max-w-md px-4 mt-6 mb-8">
                {loading ? (
                    <div className="text-center text-gray-600 py-8">Loading...</div>
                ) : (
                    ['EASY', 'MEDIUM', 'HARD']
                        .filter(level => isLevelEnabled(level))
                        .map((level) => {
                            const config = levelConfig[level];

                            return (
                                <button
                                    key={level}
                                    onClick={async () => {
                                        playSound('tap');
                                        await shuffleCards(level);
                                    }}
                                    className={`w-full py-5 rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-b-4 transition-transform duration-200 flex items-center justify-center gap-3 glass-premium border border-white/60 hover:shadow-2xl ${config.border} active:scale-[0.98] active:border-b-0`}
                                >
                                    <span>{config.icon}</span>
                                    <span className={`text-${config.colorName}-700`}>{level}</span>
                                    <span className={`text-sm opacity-75 text-${config.colorName}-600/80`}>
                                        ({config.pairs} pairs)
                                    </span>
                                </button>
                            );
                        })
                )}
                {!loading && ['EASY', 'MEDIUM', 'HARD'].every(level => !isLevelEnabled(level)) && (
                    <div className="text-center py-8 text-gray-600">
                        <p className="text-lg">No levels available yet</p>
                        <p className="text-sm mt-2">Add more symptoms to unlock difficulty levels</p>
                    </div>
                )}
            </div>

            {/* Back Link */}
            <Button variant="ghost" size="sm" onClick={() => setView('remedies')}>← Back to remedies</Button>
        </div>
    );
};

export default DifficultyView;
