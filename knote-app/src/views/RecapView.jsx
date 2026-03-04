import React, { useState, useMemo } from 'react';
import { playSound } from '../lib/audio';
import { IconArrowRight } from '../components/Icons';
import { useAuth } from '../lib/auth.jsx';
import Button from '../components/Button';

const RecapView = ({
    setView,
    selectedRemedy,
    difficulty,
    recapIndex,
    setRecapIndex,
    cards,
    onComplete,
    levelScore,
    pointsPerSymptom
}) => {
    const { displayName } = useAuth();
    const [isCollecting, setIsCollecting] = useState(false);
    const [showPointsAnim, setShowPointsAnim] = useState(false);
    const [imgReadyIndex, setImgReadyIndex] = useState(-1);
    const getPointsInfo = () => {
        switch (difficulty) {
            case 'HARD': return { perSymptom: 3 };
            case 'MEDIUM': return { perSymptom: 2 };
            case 'EASY':
            default: return { perSymptom: 2 };
        }
    };

    const pointsInfo = getPointsInfo();
    const currentPoints = pointsPerSymptom || pointsInfo.perSymptom;

    // Extract unique symptoms
    const remedyData = useMemo(() => {
        const seen = new Set();
        const unique = [];
        cards.forEach(card => {
            if (!seen.has(card.item_id)) {
                seen.add(card.item_id);
                unique.push({
                    id: card.item_id,
                    text: card.text,
                    emoji: card.content,
                    imageUrl: card.content?.startsWith('http') ? card.content : null
                });
            }
        });
        return unique;
    }, [cards]);

    const safeIndex = Math.min(recapIndex, remedyData.length - 1);
    const currentSymptom = remedyData[safeIndex] || { text: '', emoji: '' };
    const isFirstSymptom = safeIndex === 0;
    const isLastSymptom = safeIndex === remedyData.length - 1;
    const imgReady = imgReadyIndex === safeIndex;

    const handleCollect = () => {
        if (isCollecting) return;

        // 1. Play Satisfaction Sound
        try {
            playSound('collect');
        } catch (err) { }

        // 2. Start Animation
        setIsCollecting(true);
        setShowPointsAnim(true);

        // 3. Wait for animation to finish before advancing
        setTimeout(() => {
            setShowPointsAnim(false);

            if (safeIndex < remedyData.length - 1) {
                setRecapIndex((prev) => Math.min(prev + 1, remedyData.length - 1));
                setIsCollecting(false);
            } else {
                // End of slideshow
                if (onComplete) onComplete();
            }
        }, 500); // Match animation duration roughly
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-4 sm:p-6 z-20 animate-slide-up justify-center relative overflow-hidden">
            {/* Hidden preloader — keeps every image pinned in browser memory for instant display */}
            <div className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {remedyData.map(sym => sym.imageUrl && (
                    <img key={sym.id} src={sym.imageUrl} alt="" />
                ))}
            </div>
            {/* Header: Simplified Collection Tracker */}
            <div className="absolute top-4 sm:top-8 w-full px-4 flex flex-col items-center z-30">
                <h2 className="font-serif text-2xl text-red-500 font-bold mb-2">K<span className="text-black font-handwriting font-normal">note</span></h2>

                <div className="glass-premium px-6 py-3 rounded-2xl shadow-lg flex items-center gap-5 border border-white/50 relative">
                    <div className="flex flex-col items-start min-w-[100px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">COLLECTING</span>
                        <div className="text-2xl font-bold text-gray-800 leading-none mt-0.5">
                            {recapIndex + 1} <span className="text-gray-400 text-lg font-medium">/ {remedyData.length}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="h-3 w-32 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div
                                className={`h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300 ${showPointsAnim ? 'brightness-110' : ''}`}
                                style={{ width: `${((recapIndex) / remedyData.length) * 100}%` }}
                            />
                        </div>
                        <div className={`text-[10px] font-bold text-orange-500 uppercase tracking-wide transition-opacity duration-200 ${showPointsAnim ? 'opacity-100' : 'opacity-60'}`}>
                            +{currentPoints} pts per card
                        </div>
                    </div>
                </div>
            </div>

            {/* Flashcard Area */}
            <div className="relative mt-24 mb-6 z-10">
                {/* Card Container */}
                <div className={`transition-all duration-300 ${isCollecting ? 'animate-fly-away pointer-events-none' : 'animate-pop-in'}`}>
                    <div className="bg-white p-4 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] w-60 sm:w-72 aspect-[9/16] flex flex-col items-center border-[6px] border-white ring-1 ring-gray-100 relative">
                        <div className="bg-amber-50 w-full flex-1 rounded-2xl border border-amber-100 flex items-center justify-center shadow-inner relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent opacity-40"></div>
                            {currentSymptom.imageUrl ? (
                                <div className="relative w-full h-full">
                                    {!imgReady && (
                                        <div className="absolute inset-0 bg-amber-100 animate-pulse rounded-2xl" />
                                    )}
                                    <img
                                        src={currentSymptom.imageUrl}
                                        alt={currentSymptom.text}
                                        onLoad={() => setImgReadyIndex(safeIndex)}
                                        className={`relative z-10 w-full h-full object-cover transition-opacity duration-200 ${imgReady ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                </div>
                            ) : (
                                <span className="relative z-10 animate-fade-in text-8xl sm:text-9xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">{currentSymptom.emoji}</span>
                            )}
                        </div>
                        <div className="w-full mt-5 min-h-[60px] flex items-center justify-center px-1">
                            <h3 className="text-gray-800 font-bold text-center text-lg leading-snug">
                                {currentSymptom.text}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collect Button */}
            <div className="z-40">
                <Button
                    variant={isLastSymptom ? "success" : "primary"}
                    size="lg"
                    onClick={handleCollect}
                    disabled={isCollecting}
                    className={`rounded-full px-10 py-4 text-xl shadow-xl transition-all transform active:scale-95 ${isCollecting ? 'opacity-0' : 'opacity-100'}`}
                    isFullWidth={false}
                >
                    {isLastSymptom ? 'REVEAL FINAL SCORE' : 'COLLECT'}
                    {!isCollecting && <IconArrowRight className="ml-2 w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
};

export default RecapView;
