import React, { useState, useEffect } from 'react';
import { playSound } from '../lib/audio';
import { IconLock, IconCheck } from '../components/Icons';
import { getFullRemedyList, getSymptomCount, REMEDY_ORDER } from '../lib/data';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth.jsx';

const RemedyListView = ({ setView, setSelectedRemedy }) => {
    const { unlockedRemedies, levelsCompleted, isAdmin } = useAuth();
    const [remedyList, setRemedyList] = useState([]);
    const [remedyInfo, setRemedyInfo] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRemedies();
    }, []);

    const loadRemedies = async () => {
        setLoading(true);
        try {
            const allRemedies = await getFullRemedyList(db);
            setRemedyList(allRemedies);

            // Load symptom counts for each remedy in parallel
            const infoPromises = allRemedies.map(async (remedy) => {
                try {
                    return [remedy.name, await getSymptomCount(remedy.name, db)];
                } catch (e) {
                    return [remedy.name, { count: 0, easy: false, medium: false, hard: false }];
                }
            });

            const infoResults = await Promise.all(infoPromises);
            const info = Object.fromEntries(infoResults);
            setRemedyInfo(info);
        } catch (err) {
            console.error('Failed to load remedies:', err);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="w-full h-full p-3 sm:p-4 z-20 animate-slide-up flex flex-col items-center justify-start pt-12">
            <div className="w-full max-w-md flex items-center justify-center mb-3 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-serif text-red-500">K<span className="text-black font-handwriting">note</span></h2>
            </div>

            <h3 className="text-center text-gray-800 font-bold text-lg sm:text-xl mb-3 sm:mb-4 tracking-wider">REMEDIES</h3>

            <div className="w-full max-w-md glass-premium rounded-2xl sm:rounded-3xl p-3 sm:p-6 space-y-2 sm:space-y-4 overflow-y-auto flex-1 max-h-[70vh]">
                {loading ? (
                    <div className="text-center text-gray-600 py-8">Loading remedies...</div>
                ) : (
                    remedyList.map((remedy, index) => {
                        const hasCompleted = levelsCompleted?.some(
                            (level) => level.remedy?.toUpperCase?.() === remedy.name.toUpperCase()
                        );

                        // Remedies 1-10 (order 0-9) are always open.
                        // Remedies 11-20 (order 10-19) are locked unless an admin has explicitly
                        // granted access via adminGrantedRemedies in Firestore.
                        const staticOrder = REMEDY_ORDER.findIndex(
                            r => r.toUpperCase() === remedy.name.toUpperCase()
                        );
                        const needsUnlock = !remedy.isCustom && staticOrder >= 10;
                        const isUnlocked = !needsUnlock ||
                            unlockedRemedies?.some(r => r.toUpperCase() === remedy.name.toUpperCase());
                        const locked = !isUnlocked;

                        const info = remedyInfo[remedy.name];
                        const canPlay = !locked && info?.easy; // Need unlock + at least 4 symptoms

                        return (
                            <div
                                key={remedy.id}
                                onClick={() => {
                                    if (canPlay) {
                                        playSound('tap');
                                        setSelectedRemedy(remedy.name);
                                        setView('difficulty');
                                    }
                                }}
                                className={`flex items-center justify-between p-4 rounded-xl transition transform ${
                                    locked
                                        ? 'bg-gray-100/70 opacity-60 cursor-not-allowed'
                                        : !canPlay
                                            ? 'bg-blue-100/50 opacity-60 cursor-not-allowed'
                                            : 'bg-white hover:bg-blue-50 border-2 border-blue-200 shadow-sm cursor-pointer hover:scale-[1.02]'
                                }`}
                            >
                                <div className="flex flex-col">
                                    <span className={`font-bold capitalize text-lg ${locked ? 'text-gray-400' : 'text-blue-900'}`}>
                                        {index + 1}) {remedy.name}
                                        {remedy.isCustom && <span className="ml-1 text-purple-500">✨</span>}
                                    </span>
                                    <div className="flex gap-1 mt-1 items-center">
                                        {info && isAdmin && <span className="text-xs text-gray-400">{info.count} symptoms</span>}
                                    </div>
                                </div>
                                {locked ? (
                                    <span className="text-gray-400"><IconLock /></span>
                                ) : !canPlay ? (
                                    isAdmin ? (
                                        <span className="text-xs text-gray-500">Need 4+ symptoms</span>
                                    ) : (
                                        <span className="text-blue-400"><IconLock /></span>
                                    )
                                ) : hasCompleted ? (
                                    <div className="bg-green-500 text-white rounded-full p-1 shadow"><IconCheck /></div>
                                ) : (
                                    <div className="bg-blue-300 text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center text-xs font-bold">🔓</div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RemedyListView;
