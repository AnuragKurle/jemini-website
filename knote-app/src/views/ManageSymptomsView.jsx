import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth.jsx';
import { playSound } from '../lib/audio';
import { REMEDY_LIST, REMEDY_ORDER, getAllSymptomsWithOverrides, getFullRemedyList } from '../lib/data';
import ImageUpload from '../components/ImageUpload';

const ManageSymptomsView = ({ setView }) => {
    const { currentUser, isAdmin } = useAuth();
    const [remedyList, setRemedyList] = useState(REMEDY_LIST);
    const [selectedRemedy, setSelectedRemedy] = useState(REMEDY_ORDER[0] || '');
    const [symptoms, setSymptoms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState(1);
    const [newSymptom, setNewSymptom] = useState({ text: '', imageUrl: null, difficulty: 1 });
    const [editingSymptom, setEditingSymptom] = useState(null);
    const [message, setMessage] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [activeActionSheet, setActiveActionSheet] = useState(null); // symptom id

    // Add Remedy Modal
    const [showAddRemedyModal, setShowAddRemedyModal] = useState(false);
    const [newRemedyName, setNewRemedyName] = useState('');

    // Delete Remedy Modal
    const [showDeleteRemedyModal, setShowDeleteRemedyModal] = useState(false);
    const [deletingRemedy, setDeletingRemedy] = useState(false);

    useEffect(() => {
        if (!isAdmin) {
            setView('home');
            return;
        }
        loadRemedies();
        loadSymptoms();
    }, [selectedRemedy, isAdmin]);

    // Removed useEffect for emoji suggestions

    const loadRemedies = async () => {
        try {
            const allRemedies = await getFullRemedyList(db);
            setRemedyList(allRemedies);
        } catch (err) {
            console.error('Failed to load remedies:', err);
        }
    };

    const loadSymptoms = async () => {
        setLoading(true);
        try {
            const allSymptoms = await getAllSymptomsWithOverrides(selectedRemedy, db);
            setSymptoms(allSymptoms);
        } catch (err) {
            console.error('Failed to load symptoms:', err);
            setMessage('❌ Failed to load symptoms');
        } finally {
            setLoading(false);
        }
    };

    // Bucket config
    const BUCKET_CONFIG = {
        1: { label: 'Easy', icon: '🌟', max: 6, color: 'green', gradient: 'from-green-500 to-emerald-600' },
        2: { label: 'Medium', icon: '⭐', max: 14, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
        3: { label: 'Hard', icon: '🔥', max: 20, color: 'purple', gradient: 'from-purple-500 to-fuchsia-600' },
    };

    // Filtered symptoms for the active bucket
    const filteredSymptoms = symptoms.filter(s => (s.difficulty || 1) === selectedDifficulty);
    const bucketConfig = BUCKET_CONFIG[selectedDifficulty];
    const bucketFull = filteredSymptoms.length >= bucketConfig.max;

    // Per-bucket duplicate detection
    const flaggedSymptoms = (() => {
        const textCount = {};
        const imageCount = {};
        filteredSymptoms.forEach(s => {
            const normText = s.text?.trim().toLowerCase().replace(/\s+/g, ' ');
            if (normText) textCount[normText] = (textCount[normText] || 0) + 1;
            if (s.imageUrl) imageCount[s.imageUrl] = (imageCount[s.imageUrl] || 0) + 1;
        });
        return filteredSymptoms.map(s => {
            const normText = s.text?.trim().toLowerCase().replace(/\s+/g, ' ');
            return {
                ...s,
                _dupText: normText && textCount[normText] > 1,
                _dupImage: s.imageUrl && imageCount[s.imageUrl] > 1,
            };
        });
    })();

    // Per-bucket counts for tabs
    const bucketCounts = {
        1: symptoms.filter(s => (s.difficulty || 1) === 1).length,
        2: symptoms.filter(s => (s.difficulty || 1) === 2).length,
        3: symptoms.filter(s => (s.difficulty || 1) === 3).length,
    };

    const dupCount = flaggedSymptoms.filter(s => s._dupText || s._dupImage).length;

    // Delete custom remedy
    const handleDeleteRemedy = async () => {
        const currentRemedy = remedyList.find(r => r.name === selectedRemedy);
        if (!currentRemedy?.isCustom) return;

        setDeletingRemedy(true);
        try {
            // Soft-delete: set isActive to false in Firestore
            await updateDoc(doc(db, 'remedies', currentRemedy.firestoreId || currentRemedy.id), {
                isActive: false,
                deletedBy: currentUser.email,
                deletedAt: serverTimestamp()
            });
            setShowDeleteRemedyModal(false);
            setMessage('✅ Remedy deleted!');
            playSound('tap');
            // Switch to first available remedy
            const remaining = remedyList.filter(r => r.name !== selectedRemedy);
            if (remaining.length > 0) setSelectedRemedy(remaining[0].name);
            loadRemedies();
        } catch (err) {
            console.error('Failed to delete remedy:', err);
            setMessage('❌ Failed to delete remedy');
        } finally {
            setDeletingRemedy(false);
        }
    };

    // Add new custom remedy
    const handleAddRemedy = async () => {
        if (!newRemedyName.trim()) {
            setMessage('⚠️ Please enter a remedy name');
            return;
        }

        try {
            await addDoc(collection(db, 'remedies'), {
                name: newRemedyName.trim(),
                order: remedyList.length,
                isActive: true,
                isCustom: true,
                createdBy: currentUser.email,
                createdAt: serverTimestamp()
            });
            setNewRemedyName('');
            setShowAddRemedyModal(false);
            setMessage('✅ Remedy added!');
            playSound('win');
            loadRemedies();
            setSelectedRemedy(newRemedyName.trim());
        } catch (err) {
            console.error('Failed to add remedy:', err);
            setMessage('❌ Failed to add remedy');
        }
    };

    // Add new custom symptom
    const handleAddSymptom = async () => {
        if (!newSymptom.text.trim() || !newSymptom.imageUrl) {
            setMessage('⚠️ Please enter symptom text and upload an image');
            return;
        }

        try {
            await addDoc(collection(db, 'customSymptoms'), {
                remedyName: selectedRemedy,
                text: newSymptom.text.trim(),
                emoji: newSymptom.imageUrl, // Store image URL in emoji field for compatibility
                imageUrl: newSymptom.imageUrl,
                difficulty: selectedDifficulty,
                createdBy: currentUser.email,
                createdAt: serverTimestamp(),
                isActive: true,
                order: symptoms.length + 1
            });
            setNewSymptom({ text: '', imageUrl: null, difficulty: selectedDifficulty });
            setMessage('✅ Symptom added!');
            playSound('win');
            loadSymptoms();
        } catch (err) {
            console.error('Failed to add symptom:', err);
            setMessage('❌ Failed to add symptom');
        }
    };

    // Edit symptom (creates override for static, updates for custom)
    const handleSaveEdit = async () => {
        if (!editingSymptom) return;

        try {
            if (editingSymptom.source === 'static' || editingSymptom.source === 'modified') {
                // Create or update symptom override
                if (editingSymptom.overrideId) {
                    await updateDoc(doc(db, 'symptomOverrides', editingSymptom.overrideId), {
                        text: editingSymptom.text,
                        emoji: editingSymptom.imageUrl || editingSymptom.emoji,
                        imageUrl: editingSymptom.imageUrl || null,
                        modifiedBy: currentUser.email,
                        modifiedAt: serverTimestamp()
                    });
                } else {
                    await addDoc(collection(db, 'symptomOverrides'), {
                        remedyName: selectedRemedy,
                        originalId: editingSymptom.originalId,
                        text: editingSymptom.text,
                        emoji: editingSymptom.imageUrl || editingSymptom.emoji,
                        imageUrl: editingSymptom.imageUrl || null,
                        isActive: true,
                        modifiedBy: currentUser.email,
                        modifiedAt: serverTimestamp()
                    });
                }
            } else {
                // Update custom symptom
                await updateDoc(doc(db, 'customSymptoms', editingSymptom.firestoreId), {
                    text: editingSymptom.text,
                    emoji: editingSymptom.imageUrl || editingSymptom.emoji,
                    imageUrl: editingSymptom.imageUrl || null
                });
            }

            setEditingSymptom(null);
            setMessage('✅ Symptom updated!');
            playSound('win');
            loadSymptoms();
        } catch (err) {
            console.error('Failed to update symptom:', err);
            setMessage('❌ Failed to update symptom');
        }
    };

    // Delete symptom
    const handleDelete = async (symptom) => {
        if (!confirm('Are you sure you want to delete this symptom?')) return;

        try {
            if (symptom.source === 'custom') {
                await updateDoc(doc(db, 'customSymptoms', symptom.firestoreId), { isActive: false });
            } else {
                // Create override to hide static symptom
                await addDoc(collection(db, 'symptomOverrides'), {
                    remedyName: selectedRemedy,
                    originalId: symptom.originalId,
                    isActive: false,
                    modifiedBy: currentUser.email,
                    modifiedAt: serverTimestamp()
                });
            }
            setMessage('✅ Symptom deleted');
            playSound('tap');
            loadSymptoms();
        } catch (err) {
            console.error('Failed to delete symptom:', err);
            setMessage('❌ Failed to delete symptom');
        }
    };

    // Copy symptom to a different bucket (creates a new custom symptom entry)
    const handleCopyToSymptom = async (symptom, targetDifficulty) => {
        const targetCfg = BUCKET_CONFIG[targetDifficulty];
        const targetCount = bucketCounts[targetDifficulty];
        if (targetCount >= targetCfg.max) {
            setMessage(`⚠️ ${targetCfg.label} bucket is full (${targetCfg.max} max)`);
            setActiveActionSheet(null);
            return;
        }
        try {
            await addDoc(collection(db, 'customSymptoms'), {
                remedyName: selectedRemedy,
                text: symptom.text,
                emoji: symptom.imageUrl || symptom.emoji || '',
                imageUrl: symptom.imageUrl || null,
                difficulty: targetDifficulty,
                createdBy: currentUser.email,
                createdAt: serverTimestamp(),
                isActive: true,
                order: symptoms.length + 1,
                copiedFrom: symptom.id,
            });
            setMessage(`✅ Copied to ${targetCfg.label}!`);
            playSound('win');
            setActiveActionSheet(null);
            loadSymptoms();
        } catch (err) {
            console.error('Failed to copy symptom:', err);
            setMessage('❌ Failed to copy symptom');
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="w-full h-full p-3 sm:p-4 z-20 animate-fade-in overflow-y-auto pt-12">
            {/* Header */}
            <div className="flex items-center justify-center mb-6 pt-4">
                <h2 className="text-3xl font-serif text-black">
                    K<span className="font-handwriting">note</span>
                    <span className="text-sm ml-2 text-purple-600 font-bold tracking-widest">MANAGE</span>
                </h2>
            </div>

            {/* Remedy Selector Row */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-purple-50 mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Remedy to Edit</label>
                    <div className="relative">
                        <select
                            value={selectedRemedy}
                            onChange={(e) => setSelectedRemedy(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition appearance-none font-medium text-lg text-gray-800 cursor-pointer shadow-sm"
                        >
                            {remedyList.map(remedy => (
                                <option key={remedy.id} value={remedy.name}>
                                    {remedy.name} {remedy.isCustom ? '(Custom)' : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</div>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Delete button — only for custom remedies */}
                    {remedyList.find(r => r.name === selectedRemedy)?.isCustom && (
                        <button
                            onClick={() => setShowDeleteRemedyModal(true)}
                            className="flex-1 sm:flex-none bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl font-bold hover:bg-red-100 hover:border-red-300 transition flex items-center justify-center gap-2 active:scale-95"
                            title="Delete this remedy"
                        >
                            <span>🗑️</span>
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddRemedyModal(true)}
                        className="flex-1 sm:flex-none bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <span className="text-xl leading-none">+</span> New Remedy
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-3 p-2 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-100 text-green-800' :
                    message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Difficulty Tab Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
                <div className="grid grid-cols-3 gap-0">
                    {[1, 2, 3].map(diff => {
                        const cfg = BUCKET_CONFIG[diff];
                        const count = bucketCounts[diff];
                        const isActive = selectedDifficulty === diff;
                        const isFull = count >= cfg.max;
                        return (
                            <button
                                key={diff}
                                onClick={() => {
                                    setSelectedDifficulty(diff);
                                    setNewSymptom(prev => ({ ...prev, difficulty: diff }));
                                    setMessage('');
                                }}
                                className={`relative py-4 px-2 flex flex-col items-center gap-1 transition-all duration-200 ${isActive
                                    ? `bg-gradient-to-b ${cfg.gradient} text-white shadow-inner`
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="text-lg">{cfg.icon}</span>
                                <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>{cfg.label}</span>
                                <span className={`text-xs font-mono ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                    {count} / {cfg.max}
                                </span>
                                {isFull && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                        FULL
                                    </span>
                                )}
                                {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-t" />}
                            </button>
                        );
                    })}
                </div>
                {/* Bucket capacity bar */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {bucketConfig.icon} {bucketConfig.label}: {filteredSymptoms.length} / {bucketConfig.max}
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${bucketConfig.gradient}`}
                                style={{ width: `${Math.min((filteredSymptoms.length / bucketConfig.max) * 100, 100)}%` }}
                            />
                        </div>
                        {filteredSymptoms.length >= 4 && (
                            <span className="text-xs text-green-600 font-bold whitespace-nowrap">✓ Playable</span>
                        )}
                    </div>
                    {dupCount > 0 && (
                        <p className="text-xs text-orange-600 mt-1.5">⚠️ {dupCount} duplicate(s) in this bucket</p>
                    )}
                </div>
            </div>

            {/* Add New Symptom Form */}
            <div className={`bg-white rounded-2xl p-6 shadow-xl border-t-4 mb-6 relative overflow-hidden border-${bucketConfig.color}-500`}>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <span className="text-9xl">✨</span>
                </div>

                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg relative z-10">
                    <span className={`bg-${bucketConfig.color}-100 text-${bucketConfig.color}-600 p-1.5 rounded-lg text-sm`}>📝</span>
                    Add to {bucketConfig.label}
                    {bucketFull && <span className="text-xs text-orange-500 font-normal ml-2">(Bucket full)</span>}
                </h3>

                {/* Input Fields */}
                <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-shrink-0">
                            <ImageUpload
                                currentImage={newSymptom.imageUrl}
                                remedyName={selectedRemedy}
                                onImageSelect={(url) => setNewSymptom({ ...newSymptom, imageUrl: url })}
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Type symptom description..."
                            value={newSymptom.text}
                            onChange={(e) => setNewSymptom({ ...newSymptom, text: e.target.value })}
                            className={`flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-${bucketConfig.color}-500 focus:ring-4 focus:ring-${bucketConfig.color}-500/10 focus:outline-none text-base shadow-sm transition`}
                            disabled={bucketFull}
                        />
                    </div>

                    <button
                        onClick={handleAddSymptom}
                        disabled={bucketFull}
                        className={`w-full font-bold py-3 rounded-xl text-base shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${bucketFull
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : `bg-gradient-to-r ${bucketConfig.gradient} hover:shadow-xl text-white`
                            }`}
                    >
                        <span>+ Add to {bucketConfig.label}</span>
                    </button>
                </div>
            </div>

            {/* Symptoms List */}
            <div className={`flex-1 overflow-auto bg-white rounded-2xl p-6 shadow-2xl border-t-4 border-${bucketConfig.color}-500`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <span className={`bg-${bucketConfig.color}-100 text-${bucketConfig.color}-600 p-1.5 rounded-lg text-sm`}>📋</span>
                        {bucketConfig.label} Symptoms
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-1">{filteredSymptoms.length} / {bucketConfig.max}</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p>Loading symptoms...</p>
                    </div>
                ) : flaggedSymptoms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-4 border-2 border-dashed border-gray-100 rounded-xl">
                        <span className="text-4xl opacity-50">📝</span>
                        <p>No {bucketConfig.label.toLowerCase()} symptoms yet. Add your first one above!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {flaggedSymptoms.map(symptom => (
                            <div
                                key={symptom.id}
                                className={`flex items - center gap - 3 p - 4 rounded - xl border transition group hover: shadow - md ${editingSymptom?.id === symptom.id
                                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                                    : symptom.source === 'custom'
                                        ? 'bg-green-50/50 border-green-200 hover:border-green-300'
                                        : symptom.source === 'modified'
                                            ? 'bg-yellow-50/50 border-yellow-200 hover:border-yellow-300'
                                            : 'bg-white border-gray-100 hover:border-blue-200'
                                    } `}
                            >
                                {editingSymptom?.id === symptom.id ? (
                                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center w-full">
                                        <div className="flex-shrink-0">
                                            <ImageUpload
                                                currentImage={editingSymptom.imageUrl}
                                                remedyName={selectedRemedy}
                                                onImageSelect={(url) => setEditingSymptom({ ...editingSymptom, imageUrl: url })}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={editingSymptom.text}
                                            onChange={(e) => setEditingSymptom({ ...editingSymptom, text: e.target.value })}
                                            className="flex-1 w-full px-3 py-2 rounded-lg border-2 border-blue-300 focus:outline-none focus:border-blue-500"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={handleSaveEdit}
                                                className="flex-1 sm:flex-none bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 shadow-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingSymptom(null)}
                                                className="flex-1 sm:flex-none bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg font-bold hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className={`flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border text-3xl ${symptom.imageUrl ? 'border-blue-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all' : 'border-gray-100'}`}
                                            onClick={() => symptom.imageUrl && setPreviewImage(symptom.imageUrl)}
                                            title={symptom.imageUrl ? 'Click to preview' : ''}
                                        >
                                            {symptom.imageUrl ? (
                                                <img src={symptom.imageUrl} className="w-full h-full rounded-xl object-cover" alt="symptom" />
                                            ) : (
                                                symptom.emoji
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-800 font-medium text-base truncate pr-2">{symptom.text}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${symptom.difficulty === 3 ? 'bg-purple-100 text-purple-700' :
                                                    symptom.difficulty === 2 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {symptom.difficulty === 3 ? 'Hard' : symptom.difficulty === 2 ? 'Medium' : 'Easy'}
                                                </span>
                                                {symptom.source !== 'static' && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        {symptom.source === 'custom' ? 'Custom' : 'Modified'}
                                                    </span>
                                                )}
                                                {symptom._dupText && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
                                                        ⚠️ Duplicate Text
                                                    </span>
                                                )}
                                                {symptom._dupImage && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                                                        🖼️ Duplicate Image
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setActiveActionSheet(symptom.id)}
                                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition text-lg font-bold"
                                            title="Actions"
                                        >
                                            ⋮
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Action Sheet — portalled to document.body to escape CSS transform stacking context */}
            {activeActionSheet && createPortal((() => {
                const symptom = flaggedSymptoms.find(s => s.id === activeActionSheet);
                if (!symptom) return null;
                const otherBuckets = [1, 2, 3].filter(d => d !== selectedDifficulty);
                return (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 z-[9990] backdrop-blur-[2px]"
                            onClick={() => setActiveActionSheet(null)}
                        />
                        {/* Sheet */}
                        <div className="fixed bottom-0 left-0 right-0 z-[9995] animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                            <div className="glass-premium rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.15)] border-t border-white/60 overflow-hidden">
                                {/* Drag handle */}
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                                </div>

                                {/* Symptom preview */}
                                <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100">
                                    <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                                        {symptom.imageUrl
                                            ? <img src={symptom.imageUrl} className="w-full h-full object-cover" alt="" />
                                            : <span className="text-2xl">{symptom.emoji}</span>
                                        }
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 line-clamp-2 flex-1">{symptom.text}</p>
                                </div>

                                {/* Actions */}
                                <div className="px-4 py-2 space-y-1">
                                    {/* Edit */}
                                    <button
                                        onClick={() => { setEditingSymptom({ ...symptom }); setActiveActionSheet(null); }}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-50 active:bg-blue-100 transition text-left"
                                    >
                                        <span className="text-2xl">✏️</span>
                                        <span className="font-semibold text-gray-800 text-base">Edit</span>
                                    </button>

                                    {/* Copy to other buckets */}
                                    {otherBuckets.map(targetDiff => {
                                        const cfg = BUCKET_CONFIG[targetDiff];
                                        const isFull = bucketCounts[targetDiff] >= cfg.max;
                                        return (
                                            <button
                                                key={targetDiff}
                                                onClick={() => !isFull && handleCopyToSymptom(symptom, targetDiff)}
                                                disabled={isFull}
                                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition text-left ${isFull
                                                    ? 'opacity-40 cursor-not-allowed'
                                                    : 'hover:bg-green-50 active:bg-green-100'
                                                    }`}
                                            >
                                                <span className="text-2xl">📋</span>
                                                <div className="flex-1">
                                                    <span className="font-semibold text-gray-800 text-base">Copy to {cfg.label}</span>
                                                    {isFull && <span className="text-xs text-orange-500 ml-2">(full)</span>}
                                                </div>
                                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${targetDiff === 1 ? 'bg-green-100 text-green-700' :
                                                    targetDiff === 2 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {bucketCounts[targetDiff]}/{cfg.max}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    {/* Delete */}
                                    <button
                                        onClick={() => { handleDelete(symptom); setActiveActionSheet(null); }}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-red-50 active:bg-red-100 transition text-left"
                                    >
                                        <span className="text-2xl">🗑️</span>
                                        <span className="font-semibold text-red-600 text-base">Delete</span>
                                    </button>
                                </div>

                                {/* Cancel */}
                                <div className="px-4 pb-6 pt-1">
                                    <button
                                        onClick={() => setActiveActionSheet(null)}
                                        className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold rounded-2xl transition text-base"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })(), document.body)}

            {/* Add Remedy Modal */}
            {showAddRemedyModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-xl text-xl">💊</div>
                            <h3 className="font-bold text-gray-900 text-lg">Add New Remedy</h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Remedy name..."
                            value={newRemedyName}
                            onChange={(e) => setNewRemedyName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddRemedy()}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none mb-5 text-base"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddRemedy}
                                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg active:scale-95"
                            >
                                Add Remedy
                            </button>
                            <button
                                onClick={() => { setShowAddRemedyModal(false); setNewRemedyName(''); }}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Remedy Modal */}
            {showDeleteRemedyModal && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowDeleteRemedyModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
                        {/* Red danger header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-xl p-2 text-2xl">⚠️</div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Delete Remedy</h3>
                                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5">
                            <p className="text-gray-600 text-sm mb-2">You are about to permanently delete:</p>
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                                <p className="font-bold text-red-800 text-base">{selectedRemedy}</p>
                                <p className="text-red-500 text-xs mt-0.5">All associated custom symptoms will also be removed</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteRemedyModal(false)}
                                    disabled={deletingRemedy}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteRemedy}
                                    disabled={deletingRemedy}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {deletingRemedy ? (
                                        <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting...</>
                                    ) : (
                                        <>🗑️ Delete</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Lightbox — portalled to document.body to escape CSS transform stacking context */}
            {previewImage && createPortal(
                <div
                    className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-lg">🖼️</span> Image Preview
                            </h3>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center bg-gray-50" style={{ minHeight: '200px' }}>
                            <img
                                src={previewImage}
                                alt="Symptom Preview"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                            />
                        </div>
                        <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="px-5 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
};

export default ManageSymptomsView;
