import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth.jsx';
import { playSound } from '../lib/audio';

// Format seconds into a human-readable duration
const formatTotalTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds === 0) return '—';
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

// Sum timeInSeconds from all completed level entries for a user
const getUserTotalTime = (user) =>
    (user.levelsCompleted || []).reduce((sum, l) => sum + (l.timeInSeconds || 0), 0);

// Shared expanded levels panel used by both mobile cards and desktop table
const ExpandedLevels = ({ user }) => {
    if (!user.levelsCompleted?.length) return null;

    const levelMap = new Map();
    user.levelsCompleted.forEach(level => {
        const key = `${level.remedy}-${level.difficulty}`;
        if (!levelMap.has(key)) {
            levelMap.set(key, { ...level, count: 1 });
        } else {
            levelMap.get(key).count++;
        }
    });
    const uniqueLevels = Array.from(levelMap.values());

    return (
        <div>
            <div className="text-xs font-bold text-blue-900 mb-2">Completed Levels:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {uniqueLevels.map((level, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-xs text-purple-900">{level.remedy}</div>
                            {level.count > 1 && (
                                <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                    ×{level.count}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center justify-between mt-1">
                            <span className={`px-1.5 py-0.5 rounded ${level.difficulty === 'HARD' ? 'bg-purple-100 text-purple-800' :
                                level.difficulty === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                {level.difficulty}
                            </span>
                            <span>{level.timeInSeconds}s</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {new Date(level.completedAt).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminView = ({ setView }) => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('lastActiveAt');
    const [expandedUser, setExpandedUser] = useState(null);

    useEffect(() => {
        if (!isAdmin) {
            setView('home');
            return;
        }

        const fetchUsers = async () => {
            try {
                setLoading(true);
                const usersRef = collection(db, 'users');
                const q = query(usersRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);

                const userData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setUsers(userData);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setError('Failed to load user data. Please check Firestore permissions.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isAdmin, setView]);

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sortBy === 'email') {
            return (a.email || '').localeCompare(b.email || '');
        } else if (sortBy === 'createdAt') {
            return new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0);
        } else if (sortBy === 'lastActiveAt') {
            return new Date(b.lastActiveAt?.toDate?.() || 0) - new Date(a.lastActiveAt?.toDate?.() || 0);
        } else if (sortBy === 'timePlayed') {
            return getUserTotalTime(b) - getUserTotalTime(a);
        }
        return 0;
    });

    const totalTimeAllPlayers = users.reduce((sum, u) => sum + getUserTotalTime(u), 0);

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="w-full h-full p-3 sm:p-4 z-20 animate-fade-in overflow-y-auto pt-12">
            {/* Header */}
            <div className="flex items-center justify-center mb-4 sm:mb-6 pt-2">
                <h2 className="text-2xl sm:text-3xl font-serif text-black">
                    K<span className="font-handwriting">note</span>
                    <span className="text-sm ml-2 text-blue-600 font-bold">ADMIN</span>
                </h2>
            </div>

            <h3 className="text-center text-gray-800 font-bold text-lg sm:text-xl mb-3 sm:mb-4 tracking-wider">PLAYER DASHBOARD</h3>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {error}
                </div>
            )}

            {/* Controls — stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition shadow-sm text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:outline-none transition shadow-sm font-medium text-gray-700 cursor-pointer text-sm"
                    >
                        <option value="lastActiveAt">🕒 Recent</option>
                        <option value="createdAt">📅 Joined</option>
                        <option value="email">📧 A-Z</option>
                        <option value="timePlayed">⏱️ Time</option>
                    </select>
                    <button
                        onClick={() => {
                            playSound('tap');
                            setView('manageSymptoms');
                        }}
                        className="bg-white text-purple-600 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold border border-purple-100 hover:bg-purple-50 hover:border-purple-200 transition shadow-sm flex items-center gap-1.5 whitespace-nowrap text-sm"
                    >
                        <span className="text-xs">🛠️</span> <span className="hidden sm:inline">Manage </span>Symptoms
                    </button>
                </div>
            </div>

            {/* Stats — compact on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                {[
                    { value: users.length, label: 'Players', icon: '👥', border: 'border-blue-50', text: 'text-blue-900', iconBg: 'bg-blue-100 text-blue-600' },
                    { value: users.filter(u => u.levelsCompleted?.length > 0).length, label: 'Active', icon: '🎮', border: 'border-green-50', text: 'text-green-900', iconBg: 'bg-green-100 text-green-600' },
                    { value: users.reduce((sum, u) => sum + (u.levelsCompleted?.length || 0), 0), label: 'Levels Clear', icon: '🏆', border: 'border-purple-50', text: 'text-purple-900', iconBg: 'bg-purple-100 text-purple-600' },
                    { value: formatTotalTime(totalTimeAllPlayers), label: 'Total Time', icon: '⏱️', border: 'border-teal-50', text: 'text-teal-900', iconBg: 'bg-teal-100 text-teal-600' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg ${stat.border} border flex items-center justify-between gap-2 min-w-0`}>
                        <div className="min-w-0">
                            <div className={`text-xl sm:text-3xl font-bold ${stat.text} whitespace-nowrap truncate`}>{stat.value}</div>
                            <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5 sm:mt-1 whitespace-nowrap">{stat.label}</div>
                        </div>
                        <div className={`${stat.iconBg} p-2 sm:p-3 rounded-full text-sm sm:text-xl flex-shrink-0`}>{stat.icon}</div>
                    </div>
                ))}
            </div>

            {/* Player List */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl border border-blue-50 mb-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <div className="text-blue-900 font-bold text-sm">Loading players...</div>
                        </div>
                    </div>
                ) : sortedUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-500">No players found</div>
                    </div>
                ) : (
                    <>
                        {/* ===== MOBILE: Card-based layout (<sm) ===== */}
                        <div className="sm:hidden space-y-2">
                            {sortedUsers.map(user => {
                                const isExpanded = expandedUser === user.id;
                                return (
                                    <div key={user.id} className={`rounded-xl border transition ${isExpanded ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100'}`}>
                                        <button
                                            className="w-full text-left p-3 flex items-start gap-3"
                                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                        >
                                            <span className={`text-xs mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-500' : 'text-gray-300'}`}>▶</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-800 text-sm truncate">{user.displayName || 'Anonymous'}</div>
                                                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                        {user.levelsCompleted?.length || 0} levels
                                                    </span>
                                                    {getUserTotalTime(user) > 0 && (
                                                        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                            {formatTotalTime(getUserTotalTime(user))}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-400 text-[10px] leading-5">
                                                        Joined {user.createdAt?.toDate?.() ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                                                <ExpandedLevels user={user} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ===== DESKTOP: Table layout (≥sm) ===== */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="text-left py-4 px-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Player</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Email</th>
                                        <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Completed</th>
                                        <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-wider text-xs whitespace-nowrap">⏱️ Time Played</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Joined</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-400 uppercase tracking-wider text-xs whitespace-nowrap">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedUsers.map(user => (
                                        <React.Fragment key={user.id}>
                                            <tr
                                                className={`border-b border-gray-50 hover:bg-blue-50/50 transition cursor-pointer group ${expandedUser === user.id ? 'bg-blue-50/80' : ''}`}
                                                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                            >
                                                <td className="py-4 px-4 font-bold text-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs transition-transform duration-300 ${expandedUser === user.id ? 'rotate-90 text-blue-500' : 'text-gray-300 group-hover:text-blue-400'}`}>▶</span>
                                                        {user.displayName || 'Anonymous'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600 font-medium">{user.email}</td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                                                        {user.levelsCompleted?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getUserTotalTime(user) > 0 ? 'bg-teal-100 text-teal-700' : 'text-gray-400'}`}>
                                                        {formatTotalTime(getUserTotalTime(user))}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                                                    {user.createdAt?.toDate?.() ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                                                    {user.lastActiveAt?.toDate?.() ? new Date(user.lastActiveAt.toDate()).toLocaleDateString() : 'Never'}
                                                </td>
                                            </tr>
                                            {expandedUser === user.id && (
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan="6" className="p-6">
                                                        <ExpandedLevels user={user} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminView;

