import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth.jsx';

const MiniLeaderboard = ({ onViewFull }) => {
    const { currentUser } = useAuth();
    const [topPlayers, setTopPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const usersRef = collection(db, 'users');
                // Fetch more than needed to sort locally correctly since totalScore isn't in DB yet
                const q = query(usersRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setTopPlayers([]);
                    return;
                }

                const userData = [];
                snapshot.docs.forEach(doc => {
                    try {
                        const data = doc.data();
                        const totalScore = calculateScore(data?.levelsCompleted || []);
                        if (totalScore > 0) {
                            userData.push({
                                id: doc.id,
                                displayName: data?.displayName || 'Anonymous',
                                totalScore
                            });
                        }
                    } catch (err) {
                        console.warn('Skipping invalid user data', err);
                    }
                });

                // Sort and take top 5
                const sorted = userData
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .slice(0, 5);

                setTopPlayers(sorted);
            } catch (error) {
                console.error("Error fetching mini leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const calculateScore = (levelsCompleted) => {
        if (!Array.isArray(levelsCompleted) || levelsCompleted.length === 0) return 0;

        try {
            const levelMap = new Map();
            levelsCompleted.forEach(level => {
                if (level && level.remedy && level.difficulty) {
                    const key = `${level.remedy}-${level.difficulty}`;
                    if (!levelMap.has(key)) levelMap.set(key, level);
                }
            });

            let totalPoints = 0;
            levelMap.forEach(level => {
                if (level.totalPoints) {
                    totalPoints += level.totalPoints;
                } else {
                    const points = level.difficulty === 'HARD' ? 60 : level.difficulty === 'MEDIUM' ? 28 : 12;
                    totalPoints += points;
                }
            });
            return totalPoints;
        } catch (e) { return 0; }
    };

    if (loading || topPlayers.length === 0) return null;

    return (
        <div
            onClick={onViewFull}
            className="w-full max-w-sm mt-2 glass-premium rounded-xl p-3 shadow-sm border border-white/50 cursor-pointer hover:bg-white/80 transition-all duration-300 group animate-fade-in stagger-3"
        >
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top 5 Players</span>
                <span className="text-xs text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View All →</span>
            </div>

            <div className="space-y-1">
                {topPlayers.map((player, index) => {
                    const isCurrentUser = player.id === currentUser?.uid;
                    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                    return (
                        <div
                            key={player.id}
                            className={`flex items-center justify-between p-1.5 rounded-lg text-sm ${isCurrentUser ? 'bg-purple-100/50 font-semibold' : 'hover:bg-white/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="w-5 text-center font-bold text-gray-500 text-xs flex-shrink-0">
                                    {rankEmoji || `${index + 1}.`}
                                </span>
                                <span className={`truncate ${isCurrentUser ? 'text-purple-700' : 'text-gray-700'}`}>
                                    {player.displayName}
                                    {isCurrentUser && <span className="ml-1 text-[10px] text-purple-500">(You)</span>}
                                </span>
                            </div>
                            <span className="font-bold text-gray-700 ml-2">{player.totalScore}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MiniLeaderboard;
