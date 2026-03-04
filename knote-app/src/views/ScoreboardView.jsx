import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth.jsx';
import Button from '../components/Button';

const ScoreboardView = ({ setView }) => {
    const { currentUser } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRank, setUserRank] = useState(null);

    useEffect(() => {
        loadScoreboard();
    }, []);

    const loadScoreboard = async () => {
        try {
            setLoading(true);
            setError('');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setPlayers([]);
                return;
            }

            // Calculate scores safely with error handling
            const userData = [];
            snapshot.docs.forEach(doc => {
                try {
                    const data = doc.data();
                    const totalScore = calculateScore(data?.levelsCompleted || []);
                    if (totalScore > 0) {
                        userData.push({
                            id: doc.id,
                            displayName: data?.displayName || 'Anonymous',
                            levelsCompleted: data?.levelsCompleted || [],
                            totalScore
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to process user ${doc.id}:`, err);
                    // Skip this user if there's an error
                }
            });

            // Sort by score descending and limit to top 100
            const sorted = userData
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 100);

            setPlayers(sorted);

            // Find current user's rank
            if (currentUser) {
                const userIndex = sorted.findIndex(p => p.id === currentUser.uid);
                if (userIndex >= 0) {
                    setUserRank(userIndex + 1);
                }
            }
        } catch (err) {
            console.error('Failed to load scoreboard:', err);
            setError('Failed to load scoreboard. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = (levelsCompleted) => {
        if (!Array.isArray(levelsCompleted) || levelsCompleted.length === 0) return 0;

        try {
            // Deduplicate by remedy+difficulty, sum points
            const levelMap = new Map();
            levelsCompleted.forEach(level => {
                if (level && level.remedy && level.difficulty) {
                    const key = `${level.remedy}-${level.difficulty}`;
                    if (!levelMap.has(key)) {
                        levelMap.set(key, level);
                    }
                }
            });

            let totalPoints = 0;
            levelMap.forEach(level => {
                // Check for new format with totalPoints
                if (level.totalPoints) {
                    totalPoints += level.totalPoints;
                } else {
                    // Per-symptom scoring: Easy=6×2=12, Medium=14×2=28, Hard=20×3=60
                    const points = level.difficulty === 'HARD' ? 60 : level.difficulty === 'MEDIUM' ? 28 : 12;
                    totalPoints += points;
                }
            });

            return totalPoints;
        } catch (err) {
            console.warn('Error calculating score:', err);
            return 0;
        }
    };

    const getRankEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `${rank}.`;
    };

    return (
        <div className="w-full h-full p-3 sm:p-4 z-20 animate-fade-in flex flex-col overflow-hidden pt-12">
            {/* Header */}
            <div className="flex items-center justify-center mb-3 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-serif text-red-500 font-bold">
                    K<span className="text-black font-handwriting font-normal">note</span>
                </h2>
            </div>

            <h3 className="text-center text-gray-800 font-bold text-lg sm:text-xl mb-3 sm:mb-4 tracking-wider">🏆 SCOREBOARD 🏆</h3>

            {/* Scoreboard */}
            <div className="flex-1 overflow-auto glass-premium rounded-2xl sm:rounded-3xl p-3 sm:p-6 mx-auto w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-blue-900 font-bold">Loading scoreboard...</div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="text-6xl">⚠️</div>
                        <div className="text-red-600 text-center">
                            <p className="font-bold mb-2">{error}</p>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={loadScoreboard}
                                className="mt-4"
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                ) : players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="text-6xl">🎮</div>
                        <div className="text-gray-600 text-center">
                            <p className="font-bold mb-2">No scores yet!</p>
                            <p className="text-sm">Be the first to complete a level and appear on the leaderboard.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {players.map((player, index) => {
                            const isCurrentUser = player.id === currentUser?.uid;
                            const rank = index + 1;

                            return (
                                <div
                                    key={player.id}
                                    className={`flex items-center justify-between p-4 rounded-xl transition ${isCurrentUser
                                        ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-400 shadow-md'
                                        : rank <= 3
                                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
                                            : 'bg-white border-2 border-gray-200'
                                        }`}
                                >
                                    {/* Rank & Name */}
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`text-2xl font-bold ${rank <= 3 ? 'w-10' : 'w-8 text-gray-500'}`}>
                                            {getRankEmoji(rank)}
                                        </div>
                                        <div>
                                            <div className={`font-bold ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {player.displayName || 'Anonymous'}
                                                {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {player.levelsCompleted?.length || 0} levels completed
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className={`text-right ${isCurrentUser ? 'text-blue-700' : 'text-gray-700'}`}>
                                        <div className="text-2xl font-bold">{player.totalScore}</div>
                                        <div className="text-xs text-gray-500">points</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Scoring Info */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
                    <p className="font-bold mb-1">Scoring:</p>
                    <div className="space-y-0.5">
                        <p>• Easy Level: 12 pts (6 symptoms × 2)</p>
                        <p>• Medium Level: 28 pts (14 symptoms × 2)</p>
                        <p>• Hard Level: 60 pts (20 symptoms × 3)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreboardView;
