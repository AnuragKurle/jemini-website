import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ImageUpload from './ImageUpload';

const EmojiPicker = ({ value, onSelect, placeholder = "Select emoji", remedyName = "default" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('medical');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const buttonRef = useRef(null);

    const emojiCategories = {
        upload: {
            name: '📷 Upload',
            emojis: [] // Special category for image upload
        },
        medical: {
            name: '🩺 Medical',
            emojis: ['🤒', '🤕', '🤢', '🤮', '🤧', '😷', '🩺', '💊', '💉', '🩹', '🧪', '🔬', '🩻', '🧬', '🦠']
        },
        symptoms: {
            name: '🌡️ Symptoms',
            emojis: ['🔥', '💧', '🌙', '⚡', '💪', '🦷', '👁️', '👃', '👄', '🦵', '🤰', '😴', '😰', '😱', '😫', '😬', '😡', '😠', '🍑', '🥛']
        },
        emotions: {
            name: '😀 Emotions',
            emojis: ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '😢', '😭', '😤', '😩', '🥺', '😖', '😣', '😞', '😓', '😥', '😰', '😨', '😱', '😳', '😵']
        },
        nature: {
            name: '🌿 Nature',
            emojis: ['🌡️', '🌞', '🌙', '⭐', '💫', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '💨', '💧', '💦', '☔']
        },
        food: {
            name: '🍔 Food',
            emojis: ['🍗', '🍖', '🥩', '🍫', '🍬', '🍭', '🥛', '🧃', '☕', '🍵', '🥤', '🧊', '🍽️', '🥄', '🍴', '🥢', '🍞', '🧀', '🥚', '🍳']
        },
        objects: {
            name: '⚠️ Objects',
            emojis: ['⚪', '⚫', '🔴', '🔵', '🟢', '🟡', '🟠', '🟣', '🟤', '🔶', '🔷', '🔸', '🔹', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎']
        },
        body: {
            name: '👤 Body Parts',
            emojis: ['👁️', '👀', '👃', '👂', '👄', '👅', '🦷', '🦴', '💪', '👍', '👎', '✊', '👊', '🤝', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '🦶', '🦵']
        }
    };

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen]);

    const handleEmojiSelect = (emoji) => {
        onSelect(emoji);
        setIsOpen(false);
    };

    const handleImageUpload = (imageUrl) => {
        if (imageUrl) {
            setUploadedImageUrl(imageUrl);
            onSelect(imageUrl); // Pass the URL as the "emoji"
            setIsOpen(false);
        }
    };

    // Check if current value is an image URL
    const isImageUrl = value && (value.startsWith('http') || value.startsWith('data:'));

    const pickerContent = isOpen && (
        <>
            {/* Backdrop - covers entire screen */}
            <div
                className="fixed inset-0 bg-transparent"
                style={{ zIndex: 9998 }}
                onClick={() => setIsOpen(false)}
            />

            {/* Picker Modal - positioned absolutely on body */}
            <div
                className="fixed bg-white border-2 border-blue-300 rounded-xl shadow-2xl w-72 overflow-hidden"
                style={{
                    zIndex: 9999,
                    top: position.top,
                    left: position.left,
                    animation: 'fadeIn 0.15s ease-out'
                }}
            >
                {/* Header */}
                <div className="bg-blue-50 border-b border-blue-200 px-3 py-2">
                    <div className="text-sm font-bold text-blue-900">📷 Upload Symptom Image</div>
                </div>

                {/* Content Area - Image Upload Only */}
                <div className="p-4 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3 py-2">
                        <ImageUpload
                            onImageSelect={handleImageUpload}
                            currentImage={isImageUrl ? value : null}
                            remedyName={remedyName}
                        />
                        <p className="text-xs text-gray-500 text-center px-2">
                            Upload an image to represent this symptom
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-blue-200 p-2 text-center">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Emoji/Image Display Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-20 h-12 px-3 py-2 rounded-lg border-2 border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:outline-none text-center text-2xl bg-white transition flex items-center justify-center overflow-hidden"
                title="Click to select emoji or upload image"
            >
                {isImageUrl ? (
                    <img src={value} alt="Custom" className="w-full h-full object-cover rounded" />
                ) : (
                    value || '😊'
                )}
            </button>

            {/* Render picker via Portal to escape stacking context */}
            {ReactDOM.createPortal(pickerContent, document.body)}
        </>
    );
};

export default EmojiPicker;

