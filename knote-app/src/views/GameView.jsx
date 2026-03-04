import React, { useRef, useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import CoinJar from '../components/CoinJar';
import CoinAnimation from '../components/CoinAnimation';

const GameView = ({ setView, selectedRemedy, difficulty, cards, handleChoice, choiceOne, choiceTwo, disabled, matches, time, formatTime, matchAnimationData, pointsPerSymptom }) => {
    const jarRef = useRef(null);
    const gridContainerRef = useRef(null);
    const [cardMaxWidth, setCardMaxWidth] = useState(null);
    const [rowGap, setRowGap] = useState(null);

    // Card aspect ratio: 5:7 (width:height = 5/7 ≈ 0.714)
    const CARD_RATIO = 5 / 7;

    const getGridConfig = () => {
        switch (difficulty) {
            case 'HARD': return {
                // 40 cards → 8 cols × 5 rows (landscape-dominant to keep height in check)
                cols: 'grid-cols-8',
                colCount: 8,
                rowCount: 5,
                pairs: 20,
                gap: 4  // px
            };
            case 'MEDIUM': return {
                // 28 cards → 7 cols × 4 rows
                cols: 'grid-cols-7',
                colCount: 7,
                rowCount: 4,
                pairs: 14,
                gap: 5  // px
            };
            case 'EASY':
            default: return {
                // 12 cards → 4 cols × 3 rows
                cols: 'grid-cols-4',
                colCount: 4,
                rowCount: 3,
                pairs: 6,
                gap: 6  // px
            };
        }
    };

    const config = getGridConfig();

    // Compute max card width so all cards fit in the grid container
    // without overflowing in either axis (width OR height constrains, take the smaller)
    useEffect(() => {
        const el = gridContainerRef.current;
        if (!el) return;

        const compute = () => {
            const availW = el.clientWidth;
            const availH = el.clientHeight;
            const { colCount, rowCount, gap } = config;

            // Max card width constrained by container width
            const maxWFromWidth = (availW - gap * (colCount - 1)) / colCount;

            // Max card width constrained by container height (via aspect ratio)
            const maxCardH = (availH - gap * (rowCount - 1)) / rowCount;
            const maxWFromHeight = maxCardH * CARD_RATIO;

            // Use whichever is more restrictive so all cards fit on screen
            const cardW = Math.floor(Math.min(maxWFromWidth, maxWFromHeight));
            setCardMaxWidth(cardW);

            // Distribute leftover vertical space as extra row gap
            const cardH = cardW / CARD_RATIO;
            const usedH = rowCount * cardH;
            const remainingH = availH - usedH;
            const dynamicRowGap = Math.min(Math.floor(remainingH / (rowCount - 1)), 20);
            setRowGap(Math.max(dynamicRowGap, gap));
        };

        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, [difficulty, config.colCount, config.rowCount, config.gap]);

    return (
        <div className="w-full h-full flex flex-col p-2 sm:p-3 z-20 animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center mb-2 pt-1 px-1">
                <Button variant="icon" size="md" onClick={() => setView('difficulty')}>←</Button>
                <div className="flex flex-col items-center glass-premium px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-white/50">
                    <h2 className="font-serif text-2xl sm:text-3xl text-red-500 leading-none font-bold">K<span className="text-black font-handwriting font-normal">note</span></h2>
                    <span className="text-green-700 font-bold text-xs sm:text-sm tracking-widest uppercase">{selectedRemedy} - {difficulty}</span>
                </div>
                <CoinJar ref={jarRef} matches={matches} totalPairs={config.pairs} pointsPerSymptom={pointsPerSymptom} />
            </div>

            {/* Grid */}
            <div ref={gridContainerRef} className="flex-1 flex items-center justify-center px-1 sm:px-3 lg:px-4 py-1 overflow-hidden">
                <div
                    className={`grid ${config.cols}`}
                    style={{
                        columnGap: `${config.gap}px`,
                        rowGap: `${rowGap ?? config.gap}px`,
                        ...(cardMaxWidth ? { gridTemplateColumns: `repeat(${config.colCount}, ${cardMaxWidth}px)` } : {})
                    }}
                >
                    {cards.map(card => (
                        <Card
                            key={card.id}
                            card={card}
                            handleChoice={handleChoice}
                            flipped={card === choiceOne || card === choiceTwo || card.matched}
                            disabled={disabled}
                            difficulty={difficulty}
                        />
                    ))}
                </div>
            </div>

            {/* HUD */}
            <div className="flex-shrink-0 mt-1 mb-3 sm:mb-2 flex flex-col gap-1 glass-premium p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border border-white/60 mx-1" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                {/* Match dots and timer row */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-0.5 sm:gap-1 max-w-[60%]">
                        {[...Array(config.pairs)].map((_, i) => (
                            <div key={i} className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-500 ${i < matches ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,1)] scale-110' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>
                    <div className="flex items-center text-red-500 font-bold bg-red-50 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 border border-red-100 text-xs sm:text-sm">
                        <span className="mr-0.5 sm:mr-1 text-sm sm:text-base">⏱</span> {formatTime(time)}
                    </div>
                </div>
                {/* Visual time bar */}
                <div className="w-full h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min((time / 180) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>

            <CoinAnimation matchAnimationData={matchAnimationData} jarRef={jarRef} />
        </div>
    );
};

export default GameView;

