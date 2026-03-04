import React, { forwardRef, useState, useEffect, useRef, useId } from 'react';

// SVG coordinate constants
const JAR_CLIP_TOP = 11;   // y where jar content starts
const JAR_FILL_HEIGHT = 46; // height of fillable area (y=11 to y=57)

const CoinJar = forwardRef(({ matches, totalPairs, pointsPerSymptom }, ref) => {
    const uid = useId();
    const fillPercent = totalPairs > 0 ? matches / totalPairs : 0;
    const points = matches * pointsPerSymptom;
    const [jiggle, setJiggle] = useState(false);
    const [glow, setGlow] = useState(false);
    const prevMatches = useRef(matches);

    useEffect(() => {
        if (matches > prevMatches.current) {
            setJiggle(true);
            setGlow(true);
            const t1 = setTimeout(() => setJiggle(false), 450);
            const t2 = setTimeout(() => setGlow(false), 900);
            prevMatches.current = matches;
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [matches]);

    const clipId = `jc-${uid}`;
    const fillGradId = `jfg-${uid}`;
    const glassGradId = `jgg-${uid}`;

    // y-position of the fill group in SVG coords: starts at bottom (57), rises to top (11)
    const fillY = JAR_CLIP_TOP + JAR_FILL_HEIGHT * (1 - fillPercent);

    return (
        <div
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border
                backdrop-blur-sm bg-white/80
                ${glow ? 'border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.5),0_2px_10px_rgba(0,0,0,0.08)]' : 'border-amber-200/60 shadow-[0_2px_10px_rgba(245,158,11,0.15),0_2px_6px_rgba(0,0,0,0.06)]'}
                ${jiggle ? 'animate-jar-jiggle' : ''}`}
            style={{ transition: 'box-shadow 0.5s ease, border-color 0.5s ease' }}
        >
            {/* ref wraps only the SVG so coin animations target the jar center, not the pts label */}
            <div ref={ref}>
            <svg width="38" height="50" viewBox="0 0 48 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    {/* Jar body clip path */}
                    <clipPath id={clipId}>
                        <path d="M15 11 C7 13 4 18 4 24 L4 51 C4 56 8 59 14 59 L34 59 C40 59 44 56 44 51 L44 24 C44 18 41 13 33 11 Z" />
                    </clipPath>

                    {/* Liquid fill gradient: bright amber top → deep amber bottom */}
                    <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fde68a" />
                        <stop offset="35%" stopColor="#fbbf24" />
                        <stop offset="75%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>

                    {/* Glass body gradient: subtle left-to-right sheen */}
                    <linearGradient id={glassGradId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                        <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
                    </linearGradient>
                </defs>

                {/* ── LID ─────────────────────────────────────── */}
                {/* Outer cap */}
                <rect x="10" y="0" width="28" height="5.5" rx="2.75" fill="#78350f" />
                {/* Cap sheen */}
                <rect x="12" y="1" width="22" height="2" rx="1" fill="#a16207" opacity="0.75" />
                {/* Trapezoid band connecting cap to neck */}
                <path d="M11 5.5 L37 5.5 L35 9.5 L13 9.5 Z" fill="#92400e" />
                {/* Band highlight */}
                <path d="M13 5.5 L37 5.5 L35 7 L13 7 Z" fill="#b45309" opacity="0.6" />
                {/* Neck rim */}
                <rect x="13" y="9.5" width="22" height="2" rx="1" fill="#c05c1a" />

                {/* ── JAR GLASS BODY (unfilled shell) ─────────── */}
                <path
                    d="M15 11 C7 13 4 18 4 24 L4 51 C4 56 8 59 14 59 L34 59 C40 59 44 56 44 51 L44 24 C44 18 41 13 33 11 Z"
                    fill="rgba(255,248,220,0.14)"
                    stroke="#d97706"
                    strokeWidth="1.4"
                />

                {/* ── LIQUID FILL ──────────────────────────────── */}
                <g clipPath={`url(#${clipId})`}>
                    {/* Fill group rises as matches increase */}
                    <g style={{
                        transform: `translateY(${fillY}px)`,
                        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}>
                        {/* Wavy liquid surface */}
                        <path
                            d="M4 5 C9 1.5 14 8.5 20 5 C26 1.5 33 8.5 40 5 L44 5 L44 0 L4 0 Z"
                            fill="#fde68a"
                            opacity="0.9"
                        />
                        {/* Liquid body — extends far below so it always fills */}
                        <rect x="4" y="4.5" width="40" height="80" fill={`url(#${fillGradId})`} />
                    </g>
                </g>

                {/* ── GLASS OVERLAYS (drawn above fill) ───────── */}
                {/* Primary left highlight stripe */}
                <rect x="8" y="16" width="5" height="30" rx="2.5" fill="rgba(255,255,255,0.3)" />
                {/* Thin secondary right highlight */}
                <rect x="37" y="16" width="2.5" height="16" rx="1.25" fill="rgba(255,255,255,0.16)" />
                {/* Glass sheen overlay (left-to-right gradient) */}
                <path
                    d="M15 11 C7 13 4 18 4 24 L4 51 C4 56 8 59 14 59 L34 59 C40 59 44 56 44 51 L44 24 C44 18 41 13 33 11 Z"
                    fill={`url(#${glassGradId})`}
                />
                {/* Bottom inner shine ellipse */}
                <ellipse cx="24" cy="56.5" rx="11" ry="2" fill="rgba(255,255,255,0.18)" />
            </svg>
            </div>

            {/* Points label */}
            <div className="flex items-baseline gap-0.5 leading-none">
                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide">pts</span>
                <span className="text-[11px] font-extrabold text-amber-700">
                    {points > 0 ? `+${points}` : '0'}
                </span>
            </div>
        </div>
    );
});

CoinJar.displayName = 'CoinJar';
export default CoinJar;
