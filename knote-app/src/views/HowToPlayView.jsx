import React from 'react';
import Button from '../components/Button';
import { playSound } from '../lib/audio';

const HowToPlayView = ({ setView }) => {
    const steps = [
        {
            emoji: '💊',
            title: 'Pick a Remedy',
            desc: 'Choose a remedy from the list to start learning its symptoms.'
        },
        {
            emoji: '🎯',
            title: 'Choose Difficulty',
            desc: 'Easy (6 pairs), Medium (14 pairs), or Hard (20 pairs) — each unlocks as more symptoms are added.'
        },
        {
            emoji: '🃏',
            title: 'Flip & Match Cards',
            desc: 'Tap cards to flip them. Find matching pairs of identical symptom cards as fast as you can!'
        },
        {
            emoji: '⏱️',
            title: 'Beat the Clock',
            desc: 'Your completion time is tracked. Faster finishes earn you bragging rights on the leaderboard.'
        },
        {
            emoji: '📖',
            title: 'Review Symptoms',
            desc: 'After completing a match, review all symptoms as flashcards to reinforce your learning.'
        },
        {
            emoji: '🏆',
            title: 'Earn Points & Rank Up',
            desc: 'Each level completed earns points. Climb the leaderboard and unlock new remedies!'
        },
    ];

    return (
        <div className="w-full h-full z-20 animate-fade-in flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-center pt-14 pb-4">
                <h2 className="text-3xl font-serif text-red-500 font-bold">
                    K<span className="text-black font-handwriting font-normal">note</span>
                </h2>
            </div>

            <h3 className="text-center text-gray-800 font-bold text-xl mb-2 tracking-wider">
                HOW TO PLAY
            </h3>
            <p className="text-center text-gray-500 text-sm mb-6 px-6">
                Learn materia medica through a fun memory card game
            </p>

            {/* Steps list – scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
                <div className="max-w-md mx-auto space-y-4">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="flex gap-4 items-start glass-premium rounded-2xl p-4 border border-blue-50"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                                {step.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">
                                        STEP {index + 1}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-800 text-base">{step.title}</h4>
                                <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* Difficulty guide */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100 mt-6">
                        <h4 className="font-bold text-blue-900 text-center mb-3">🎮 Difficulty Levels</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[70px] text-center">EASY</span>
                                <span className="text-sm text-gray-700">6 pairs to match – great for beginners</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[70px] text-center">MEDIUM</span>
                                <span className="text-sm text-gray-700">14 pairs – test your memory</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[70px] text-center">HARD</span>
                                <span className="text-sm text-gray-700">20 pairs – for true masters</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="px-5 py-4 bg-gradient-to-t from-white to-transparent">
                <div className="max-w-md mx-auto">
                    <Button
                        variant="primary"
                        size="lg"
                        isFullWidth
                        onClick={() => {
                            playSound('tap');
                            setView('remedies');
                        }}
                    >
                        🎮 Start Playing
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HowToPlayView;
