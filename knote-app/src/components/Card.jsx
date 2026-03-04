import React, { useState } from 'react';

const Card = ({ card, handleChoice, flipped, disabled, difficulty }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const handleClick = () => {
        if (!disabled && !flipped) {
            handleChoice(card);
        }
    };

    const getSizeClasses = () => {
        switch (difficulty) {
            case 'HARD':
                return {
                    container: 'w-full aspect-[5/7]',
                    text: 'text-[6px] sm:text-[8px]',
                    emoji: 'text-base sm:text-lg',
                    kLetter: 'text-sm sm:text-base',
                    border: 'border-[1.5px] sm:border-2'
                };
            case 'MEDIUM':
                return {
                    container: 'w-full aspect-[5/7]',
                    text: 'text-[7px] sm:text-[9px]',
                    emoji: 'text-lg sm:text-xl',
                    kLetter: 'text-base sm:text-lg',
                    border: 'border-2 sm:border-[2.5px]'
                };
            case 'EASY':
            default:
                return {
                    container: 'w-full aspect-[5/7]',
                    text: 'text-[8px] sm:text-[10px]',
                    emoji: 'text-xl sm:text-2xl',
                    kLetter: 'text-lg sm:text-xl',
                    border: 'border-2 sm:border-[2.5px]'
                };
        }
    };

    const sizes = getSizeClasses();

    return (
        <div data-card-id={card.id} className={`relative ${sizes.container} cursor-pointer perspective-1000 transition-transform duration-200 active:scale-[0.98]`} onClick={handleClick}>
            <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>

                {/* Front (Red Backing) */}
                <div className={`absolute w-full h-full backface-hidden ${sizes.border} border-white rounded-md sm:rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white flex items-center justify-center overflow-hidden`}>
                    <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 relative">
                        <div className="absolute inset-0 border-2 sm:border-4 border-white/30 m-0.5 sm:m-1 rounded"></div>
                        <div className={`w-full h-full flex items-center justify-center text-white font-bold ${sizes.kLetter} skew-y-12 font-serif opacity-90`}>
                            K
                        </div>
                    </div>
                </div>

                {/* Back (Content) */}
                <div className={`absolute w-full h-full backface-hidden rotate-y-180 bg-white ${sizes.border} ${card.matched ? 'border-green-400 ring-2 ring-green-200' : 'border-blue-200'} rounded-md sm:rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col items-center justify-center p-0.5 sm:p-1 text-center transition-all`}>
                    {card.type === 'image' && card.content?.startsWith('http') ? (
                        <div className="relative w-full h-full rounded overflow-hidden">
                            {!imgLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-50 animate-pulse rounded" />
                            )}
                            <img
                                src={card.content}
                                alt={card.text || 'symptom'}
                                className={`w-full h-full object-cover rounded transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgLoaded(true)}
                            />
                        </div>
                    ) : (
                        <div className={`${sizes.emoji} animate-float leading-none`}>{card.content}</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Card;
