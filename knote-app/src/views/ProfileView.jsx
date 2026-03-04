import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth.jsx';
import { playSound } from '../lib/audio';
import Button from '../components/Button';

const ProfileView = ({ setView }) => {
    const { currentUser, displayName } = useAuth();
    const [newName, setNewName] = useState(displayName || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: newName
            });
            setMessage('✅ Name updated! Please refresh the page to see changes.');
            playSound('win');
        } catch (err) {
            setMessage('❌ Failed to update name. Please try again.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 z-20 animate-fade-in flex flex-col overflow-auto pt-14">
            {/* Header */}
            <div className="flex items-center justify-center mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-serif text-black">
                    K<span className="font-handwriting">note</span>
                </h2>
            </div>

            <h3 className="text-center text-gray-800 font-bold text-lg sm:text-xl mb-4 sm:mb-6 tracking-wider">MY PROFILE</h3>

            <div className="max-w-md mx-auto w-full glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <div className="bg-gray-100 px-4 py-3 rounded-lg text-gray-600">
                        {currentUser?.email}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <form onSubmit={handleUpdateName} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={50}
                            className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This name will appear in game recaps and admin dashboard
                        </p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('✅')
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isFullWidth
                        isLoading={saving}
                        disabled={!newName.trim()}
                    >
                        Update Name
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        <p className="font-bold mb-2">Current Stats:</p>
                        <p>• Remedies Unlocked: Check your progress in the game</p>
                        <p>• Password: Use "Forgot password?" on login to reset</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
