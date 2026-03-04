import React, { useRef, useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

const ImageUpload = ({ onImageSelect, currentImage, remedyName }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentImage || null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setPreviewUrl(currentImage || null);
    }, [currentImage]);

    // Compress image before upload
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize if too large
                    const maxSize = 800;
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.85);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB for original)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            // Compress image
            const compressedBlob = await compressImage(file);

            // Create unique filename
            const timestamp = Date.now();
            const sanitizedRemedyName = remedyName.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `symptom-images/${sanitizedRemedyName}/${timestamp}.jpg`;
            const storageRef = ref(storage, filename);

            // Upload compressed file
            await uploadBytes(storageRef, compressedBlob, {
                contentType: 'image/jpeg'
            });

            // Get download URL
            const downloadUrl = await getDownloadURL(storageRef);

            setPreviewUrl(downloadUrl);
            onImageSelect(downloadUrl);
            setError(null);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Upload failed. Check Firebase Storage rules.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        onImageSelect(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const [showPreview, setShowPreview] = useState(false);

    return (
        <>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                    />

                    {previewUrl ? (
                        <div className="relative group">
                            <img
                                src={previewUrl}
                                alt="Symptom"
                                onClick={() => setShowPreview(true)}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition"
                                title="Click to preview"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                                title="Remove image"
                            >
                                ×
                            </button>
                            {/* Preview hint on hover */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                Click to preview
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`w-12 h-12 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 flex items-center justify-center transition ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'
                                }`}
                            title="Upload custom image"
                        >
                            {uploading ? (
                                <span className="text-xl">⏳</span>
                            ) : (
                                <span className="text-xl">📷</span>
                            )}
                        </button>
                    )}
                </div>
                {error && (
                    <div className="text-xs text-red-600 max-w-xs">{error}</div>
                )}
                {uploading && (
                    <div className="text-xs text-blue-600">Uploading...</div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && previewUrl && (
                <div
                    className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <h3 className="font-bold text-gray-800">Image Preview</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center bg-gray-50">
                            <img
                                src={previewUrl}
                                alt="Symptom Preview"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={handleRemoveImage}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
                            >
                                🗑️ Remove Image
                            </button>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageUpload;
