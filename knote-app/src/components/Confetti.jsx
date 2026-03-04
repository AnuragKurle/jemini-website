import React, { useState, useEffect } from 'react';

const Confetti = () => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#FFD700', '#00CED1', '#FF69B4'];
        const shapes = ['■', '●', '▲', '★'];
        const newParticles = Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            animationDuration: Math.random() * 3 + 2 + 's',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 2 + 's',
            size: Math.random() * 8 + 6 + 'px',
            rotation: Math.random() * 360 + 'deg'
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="confetti"
                    style={{
                        left: p.left,
                        top: '-20px',
                        width: p.size,
                        height: p.size,
                        animationDuration: p.animationDuration,
                        animationDelay: p.delay,
                        backgroundColor: p.backgroundColor,
                        transform: `rotate(${p.rotation})`
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;
