import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../lib/audio';

const COINS_PER_CARD = 4;
const COIN_SIZE = 14;
const ANIMATION_DURATION = 700;
const STAGGER_DELAY = 40;

const CoinAnimation = ({ matchAnimationData, jarRef }) => {
    const [coinBatches, setCoinBatches] = useState([]);
    const processedIds = useRef(new Set());
    const timeouts = useRef([]);

    useEffect(() => {
        return () => timeouts.current.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        if (!matchAnimationData || !jarRef?.current) return;
        if (processedIds.current.has(matchAnimationData.id)) return;
        processedIds.current.add(matchAnimationData.id);

        const jarRect = jarRef.current.getBoundingClientRect();
        const targetX = jarRect.left + jarRect.width / 2;
        const targetY = jarRect.top + jarRect.height / 2;

        const coins = [];
        matchAnimationData.positions.forEach((pos, cardIdx) => {
            for (let i = 0; i < COINS_PER_CARD; i++) {
                const angle = (Math.PI * 2 * i) / COINS_PER_CARD + cardIdx * 0.3;
                const spread = 10;
                const startX = pos.x + Math.cos(angle) * spread - COIN_SIZE / 2;
                const startY = pos.y + Math.sin(angle) * spread - COIN_SIZE / 2;
                const dx = targetX - pos.x - Math.cos(angle) * spread;
                const dy = targetY - pos.y - Math.sin(angle) * spread;

                coins.push({
                    id: `${matchAnimationData.id}-${cardIdx}-${i}`,
                    startX,
                    startY,
                    dx,
                    dy,
                    // Overshoot arc: coin flies above the jar then curves down into it
                    arcY: dy - 45,
                    midX: dx * 0.5,
                    delay: (cardIdx * COINS_PER_CARD + i) * STAGGER_DELAY,
                });
            }
        });

        const batchId = matchAnimationData.id;
        setCoinBatches(prev => [...prev, { id: batchId, coins }]);

        const soundTimeout = setTimeout(() => {
            playSound('coinCollect');
        }, ANIMATION_DURATION - 80);
        timeouts.current.push(soundTimeout);

        const totalDuration = ANIMATION_DURATION + coins.length * STAGGER_DELAY + 100;
        const cleanupTimeout = setTimeout(() => {
            setCoinBatches(prev => prev.filter(b => b.id !== batchId));
        }, totalDuration);
        timeouts.current.push(cleanupTimeout);
    }, [matchAnimationData, jarRef]);

    if (coinBatches.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
            {coinBatches.map(batch =>
                batch.coins.map(coin => (
                    <div
                        key={coin.id}
                        className="absolute coin-particle"
                        style={{
                            left: coin.startX,
                            top: coin.startY,
                            width: COIN_SIZE,
                            height: COIN_SIZE,
                            '--coin-dx': `${coin.dx}px`,
                            '--coin-dy': `${coin.dy}px`,
                            '--coin-arc': `${coin.arcY}px`,
                            '--coin-dx-mid': `${coin.midX}px`,
                            animationDelay: `${coin.delay}ms`,
                            animationDuration: `${ANIMATION_DURATION}ms`,
                        }}
                    >
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 border border-amber-700/40 shadow-[0_0_6px_rgba(245,158,11,0.6)] flex items-center justify-center">
                            <span className="text-[7px] font-bold text-amber-900/60 leading-none">★</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default CoinAnimation;
