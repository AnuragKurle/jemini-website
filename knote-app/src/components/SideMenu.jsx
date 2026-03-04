import React from 'react';
import { playSound } from '../lib/audio';

const SideMenu = ({ isOpen, onClose, setView, onLogout, isAdmin }) => {
    if (!isOpen) return null;

    const menuItems = [
        { id: 'remedies', label: 'REMEDIES', view: 'remedies' },
        { id: 'scoreboard', label: 'LEADERBOARD', view: 'scoreboard' },
        { id: 'howToPlay', label: 'HOW TO PLAY', view: 'howToPlay' },
        { id: 'profile', label: 'MY ACCOUNT', view: 'profile' },
    ];

    const handleNavigate = (viewName) => {
        playSound('tap');
        setView(viewName);
        onClose();
    };

    const handleLogout = async () => {
        playSound('tap');
        await onLogout();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 animate-fade-in" style={{ transition: 'none' }}>
            {/* Full-page white background */}
            <div className="absolute inset-0 bg-white" />

            {/* Close button (top-left) */}
            <button
                onClick={onClose}
                className="absolute top-5 left-5 z-10 text-red-500 hover:text-red-600 transition-colors"
                aria-label="Close menu"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
            </button>

            {/* Centered content */}
            <div className="relative flex flex-col items-center justify-center h-full px-8">
                {/* Knote Logo */}
                <div className="mb-12">
                    <img
                        src="/logo.png"
                        alt="Knote Logo"
                        className="h-20 w-auto object-contain mx-auto drop-shadow-sm mix-blend-multiply"
                    />
                </div>

                {/* Menu Items */}
                <nav className="flex flex-col items-center gap-6">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.view)}
                            className="text-gray-800 text-base font-semibold tracking-[0.25em] hover:text-blue-600 transition-colors duration-200 py-2 px-4"
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Bottom: Logout */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 text-sm font-medium tracking-widest hover:text-red-500 transition-colors duration-200 flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        LOGOUT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SideMenu;
