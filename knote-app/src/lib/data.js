export const REMEDY_ORDER = [
    'Arnica Montana',
    'Rhus Tox',
    'Symphytum',
    'Hypericum',
    'Sulphur',
    'Ledum Pal',
    'Natrum Mur',
    'Silicea',
    'Bryonia Alba',
    'Calcarea carb',
    'Baryta carb',
    'Ruta',
    'Calendula',
    'Aconite nap',
    'Aloes soc',
    'Colchicum',
    'Colocynth',
    'Dioscorea',
    'Cina',
    'Apis mel',
];

export const REMEDY_LIST = REMEDY_ORDER.map((name, idx) => ({ id: idx + 1, name }));

export const CINA_DATA = [
    { id: 1, text: "Worm Remedy", emoji: "🐛" },
    { id: 2, text: "Desire for Sweets", emoji: "🍫" },
    { id: 3, text: "Boring of Nose", emoji: "👃" },
    { id: 4, text: "Redness of Cheeks", emoji: "😳" },
    { id: 5, text: "Canine Hunger", emoji: "🍗" },
    { id: 6, text: "Colicky Pain", emoji: "🤢" },
    { id: 7, text: "Irritability", emoji: "😠" },
    { id: 8, text: "Grinding Teeth", emoji: "🦷" },
    { id: 9, text: "Screaming in Sleep", emoji: "😱" },
    { id: 10, text: "Pale Face", emoji: "⚪" },
    { id: 11, text: "Blue Circles Around Eyes", emoji: "👁️" },
    { id: 12, text: "Itching of Anus", emoji: "🍑" },
    { id: 13, text: "Urine Milky", emoji: "🥛" },
    { id: 14, text: "Cough with Gagging", emoji: "😫" },
    { id: 15, text: "Touchy & Cross", emoji: "😡" },
    { id: 16, text: "Twitching of Limbs", emoji: "🦵" },
    { id: 17, text: "Abdomen Hard", emoji: "🤰" },
    { id: 18, text: "Thirst for Cold Water", emoji: "💧" },
    { id: 19, text: "Better Lying on Belly", emoji: "🛌" },
    { id: 20, text: "Worse at Night", emoji: "🌙" },
];

export const ARNICA_MONTANA_DATA = [
    { id: 1, text: "Bruised Feeling", emoji: "🤕" },
    { id: 2, text: "Fear of Touch", emoji: "😨" },
    { id: 3, text: "Bed Feels Hard", emoji: "🛏️" },
    { id: 4, text: "Trauma & Shock", emoji: "💥" },
    { id: 5, text: "Hot Head, Cold Body", emoji: "🌡️" },
    { id: 6, text: "Everything Feels Sore", emoji: "😣" },
    { id: 7, text: "Sprains & Strains", emoji: "🦶" },
    { id: 8, text: "Bleeding from Injuries", emoji: "🩸" },
    { id: 9, text: "Soreness After Labor", emoji: "🤰" },
    { id: 10, text: "Concussion", emoji: "🧠" },
    { id: 11, text: "Symmetrical Eruptions", emoji: "🔴" },
    { id: 12, text: "Foul Breath", emoji: "👄" },
    { id: 13, text: "Better Lying Down", emoji: "🛌" },
    { id: 14, text: "Worse After Motion", emoji: "🚶" },
    { id: 15, text: "Dark Red Face", emoji: "👺" },
    { id: 16, text: "Offensive Stools", emoji: "💩" },
    { id: 17, text: "Muscle Aches", emoji: "💪" },
    { id: 18, text: "Physical Overexertion", emoji: "🏃" },
    { id: 19, text: "Sudden Weakness", emoji: "📉" },
    { id: 20, text: "Nervous Sensitivity", emoji: "⚡" },
];

export const REMEDY_DATA_MAP = {
    'Cina': CINA_DATA,
    'Arnica Montana': ARNICA_MONTANA_DATA,
    // Add placeholders for others to prevent crashes
    'default': CINA_DATA
};

import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Fetches remedy data combining static + custom symptoms with overrides applied
 * Filters to a specific difficulty bucket (1=Easy, 2=Medium, 3=Hard)
 * Each difficulty is an independent pool of symptoms
 * @param {string} remedyName - Name of the remedy (e.g., "Cina")
 * @param {object} db - Firestore database instance
 * @param {number} [difficulty] - Optional difficulty filter (1=Easy, 2=Medium, 3=Hard). If omitted, returns all.
 * @returns {Promise<Array>} Combined symptom array filtered to the specified difficulty
 */
export const getRemedyData = async (remedyName, db, difficulty) => {
    // Get static symptoms
    const baseSymptoms = REMEDY_DATA_MAP[remedyName] || REMEDY_DATA_MAP['default'];

    try {
        // Fetch overrides for static symptoms
        const overridesRef = collection(db, 'symptomOverrides');
        const overridesQuery = query(
            overridesRef,
            where('remedyName', '==', remedyName)
        );
        const overridesSnapshot = await getDocs(overridesQuery);

        // Build overrides map
        const overrides = {};
        overridesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            overrides[data.originalId] = data;
        });

        // Apply overrides to static symptoms (static symptoms default to difficulty 1=Easy)
        const staticSymptoms = baseSymptoms.map(sym => {
            const override = overrides[sym.id];
            // Skip if override marks it as inactive/deleted
            if (override && override.isActive === false) {
                return null;
            }
            return {
                id: sym.id,
                text: override?.text || sym.text,
                emoji: override?.emoji || sym.emoji,
                imageUrl: override?.imageUrl || null,
                difficulty: override?.difficulty || 1 // Default to Easy for static symptoms
            };
        }).filter(Boolean);

        // Fetch custom symptoms from Firestore
        const customRef = collection(db, 'customSymptoms');
        const q = query(
            customRef,
            where('remedyName', '==', remedyName),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        // Map custom symptoms to match static format
        const customSymptoms = snapshot.docs.map(doc => ({
            id: `custom-${doc.id}`,
            text: doc.data().text,
            emoji: doc.data().emoji,
            imageUrl: doc.data().imageUrl || null,
            difficulty: doc.data().difficulty || 1, // Default to Easy if not set
            isCustom: true,
            firestoreId: doc.id
        }));

        // Combine all symptoms
        const allSymptoms = [...staticSymptoms, ...customSymptoms];

        // Filter to specific difficulty bucket if provided
        if (difficulty) {
            return allSymptoms.filter(s => (s.difficulty || 1) === difficulty);
        }

        return allSymptoms;
    } catch (err) {
        console.error('Failed to load symptoms:', err);
        // Fallback to static data only
        return baseSymptoms;
    }
};

/**
 * Get ALL symptoms for a remedy (static + custom) for management view
 * @param {string} remedyName - Name of the remedy
 * @param {object} db - Firestore database instance
 * @returns {Promise<Array>} All symptoms with source badges
 */
export const getAllSymptoms = async (remedyName, db) => {
    // Get static symptoms
    const staticSymptoms = (REMEDY_DATA_MAP[remedyName] || REMEDY_DATA_MAP['default']).map(sym => ({
        ...sym,
        source: 'static',
        id: `static-${sym.id}`,
        originalId: sym.id,
        badge: '📋'
    }));

    try {
        // Fetch custom symptoms from Firestore
        const customRef = collection(db, 'customSymptoms');
        const q = query(
            customRef,
            where('remedyName', '==', remedyName),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        // Map custom symptoms
        const customSymptoms = snapshot.docs.map(doc => ({
            id: doc.id,
            text: doc.data().text,
            emoji: doc.data().emoji,
            source: 'custom',
            badge: '✨',
            firestoreId: doc.id
        }));

        // Combine: static first, then custom
        return [...staticSymptoms, ...customSymptoms];
    } catch (err) {
        console.error('Failed to load symptoms:', err);
        // Fallback to static data only
        return staticSymptoms;
    }
};

/**
 * Suggest emojis based on symptom text
 * @param {string} text - Symptom text
 * @returns {Array<string>} Array of suggested emojis (max 3)
 */
export const suggestEmojis = (text) => {
    const lowerText = text.toLowerCase();
    const suggestions = [];

    // Medical keywords
    if (/pain|ache|hurt|sore/.test(lowerText)) suggestions.push('🤕', '😣', '💊');
    else if (/fever|hot|burn/.test(lowerText)) suggestions.push('🌡️', '🔥', '🤒');
    else if (/cold|chill|freeze/.test(lowerText)) suggestions.push('🥶', '❄️', '🌡️');
    else if (/cough|throat/.test(lowerText)) suggestions.push('🤧', '😷', '🤒');
    else if (/vomit|nause|sick/.test(lowerText)) suggestions.push('🤮', '🤢', '😷');
    else if (/dizz|spin|vertigo/.test(lowerText)) suggestions.push('😵', '💫', '🌀');
    else if (/head/.test(lowerText)) suggestions.push('🧠', '🤕', '💆');
    else if (/eye|vision|see/.test(lowerText)) suggestions.push('👁️', '👀', '😑');
    else if (/nose|smell|sniff/.test(lowerText)) suggestions.push('👃', '🤧', '😤');
    else if (/ear|hear/.test(lowerText)) suggestions.push('👂', '🔇', '🔊');
    else if (/mouth|lip|tongue/.test(lowerText)) suggestions.push('👄', '👅', '😛');
    else if (/tooth|teeth|dental/.test(lowerText)) suggestions.push('🦷', '😬', '🪥');
    else if (/stomach|belly|abdomen/.test(lowerText)) suggestions.push('🤰', '🍽️', '😫');
    else if (/heart|cardiac/.test(lowerText)) suggestions.push('❤️', '💔', '💓');
    else if (/breath|lung|respiratory/.test(lowerText)) suggestions.push('🫁', '💨', '😮‍💨');
    else if (/muscle|limb|arm|leg/.test(lowerText)) suggestions.push('💪', '🦵', '🦴');
    else if (/bone|skeleton/.test(lowerText)) suggestions.push('🦴', '☠️', '💀');
    else if (/skin|rash|itch/.test(lowerText)) suggestions.push('🩹', '🔴', '😖');
    else if (/blood|bleed/.test(lowerText)) suggestions.push('🩸', '💉', '🔴');

    // Emotions
    else if (/angry|rage|mad|irritable/.test(lowerText)) suggestions.push('😡', '😠', '🤬');
    else if (/sad|depress|cry/.test(lowerText)) suggestions.push('😢', '😭', '😞');
    else if (/happy|joy|glad/.test(lowerText)) suggestions.push('😊', '😃', '😄');
    else if (/fear|scare|afraid/.test(lowerText)) suggestions.push('😱', '😨', '😰');
    else if (/sleep|tired|exhaust|fatigue/.test(lowerText)) suggestions.push('😴', '🛌', '💤');
    else if (/stress|anxious|worry/.test(lowerText)) suggestions.push('😰', '😟', '😥');

    // Food/Digestion
    else if (/hunger|appetite|eat/.test(lowerText)) suggestions.push('🍗', '🍽️', '😋');
    else if (/thirst|drink|water/.test(lowerText)) suggestions.push('💧', '🥛', '🚰');
    else if (/sweet/.test(lowerText)) suggestions.push('🍫', '🍬', '🍭');

    // Time/Conditions
    else if (/night|dark|evening/.test(lowerText)) suggestions.push('🌙', '🌃', '🌌');
    else if (/day|morning|sun/.test(lowerText)) suggestions.push('☀️', '🌞', '🌅');

    // General symptoms
    else if (/weakness|weak/.test(lowerText)) suggestions.push('📉', '😓', '💪');
    else if (/swelling|swell|bloat/.test(lowerText)) suggestions.push('🎈', '💦', '🫧');
    else if (/dry|dehydrat/.test(lowerText)) suggestions.push('🏜️', '💧', '🥤');

    // Default medical emojis if no match
    if (suggestions.length === 0) {
        suggestions.push('🩺', '💊', '🤒');
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
};

/**
 * Get full remedy list (static + custom from Firestore)
 * @param {object} db - Firestore database instance
 * @returns {Promise<Array>} Complete remedy list with order
 */
export const getFullRemedyList = async (db) => {
    // Start with static remedies
    const staticRemedies = REMEDY_ORDER.map((name, idx) => ({
        id: `static-${idx}`,
        name,
        order: idx,
        isCustom: false
    }));

    try {
        // Fetch custom remedies from Firestore
        const remediesRef = collection(db, 'remedies');
        const q = query(remediesRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);

        const customRemedies = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            order: doc.data().order || 100,
            isCustom: true,
            firestoreId: doc.id
        }));

        // Merge and sort by order
        const allRemedies = [...staticRemedies, ...customRemedies];
        allRemedies.sort((a, b) => a.order - b.order);

        return allRemedies;
    } catch (err) {
        console.error('Failed to load remedies:', err);
        return staticRemedies;
    }
};

/**
 * Get ALL symptoms with overrides applied
 * @param {string} remedyName - Name of the remedy
 * @param {object} db - Firestore database instance
 * @returns {Promise<Array>} All symptoms with overrides applied
 */
export const getAllSymptomsWithOverrides = async (remedyName, db) => {
    // Get static symptoms
    const baseSymptoms = REMEDY_DATA_MAP[remedyName] || REMEDY_DATA_MAP['default'] || [];

    try {
        // Fetch overrides for static symptoms
        const overridesRef = collection(db, 'symptomOverrides');
        const overridesQuery = query(
            overridesRef,
            where('remedyName', '==', remedyName)
        );
        const overridesSnapshot = await getDocs(overridesQuery);

        const overrides = {};
        overridesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            overrides[data.originalId] = {
                ...data,
                firestoreId: doc.id
            };
        });

        // Apply overrides to static symptoms
        const staticSymptoms = baseSymptoms.map(sym => {
            const override = overrides[sym.id];
            if (override && override.isActive === false) {
                return null; // Symptom hidden
            }
            return {
                id: `static-${sym.id}`,
                originalId: sym.id,
                text: override?.text || sym.text,
                emoji: override?.emoji || sym.emoji,
                imageUrl: override?.imageUrl || null,
                difficulty: override?.difficulty || 1,
                source: override ? 'modified' : 'static',
                hasOverride: !!override,
                overrideId: override?.firestoreId
            };
        }).filter(Boolean);

        // Fetch custom symptoms
        const customRef = collection(db, 'customSymptoms');
        const customQuery = query(
            customRef,
            where('remedyName', '==', remedyName),
            where('isActive', '==', true)
        );
        const customSnapshot = await getDocs(customQuery);

        const customSymptoms = customSnapshot.docs.map(doc => ({
            id: doc.id,
            text: doc.data().text,
            emoji: doc.data().emoji,
            imageUrl: doc.data().imageUrl || null,
            difficulty: doc.data().difficulty || 1,
            source: 'custom',
            firestoreId: doc.id
        }));

        return [...staticSymptoms, ...customSymptoms];
    } catch (err) {
        console.error('Failed to load symptoms:', err);
        return baseSymptoms.map(sym => ({
            ...sym,
            id: `static-${sym.id}`,
            originalId: sym.id,
            source: 'static'
        }));
    }
};

/**
 * Get per-bucket symptom counts for a remedy to determine available difficulty levels
 * Each difficulty bucket is independent: Easy, Medium, Hard
 * A bucket is playable when it has at least 4 symptoms (minimum for card pairs)
 * @param {string} remedyName - Name of the remedy
 * @param {object} db - Firestore database instance
 * @returns {Promise<{count: number, easyCount: number, mediumCount: number, hardCount: number, easy: boolean, medium: boolean, hard: boolean}>}
 */
export const getSymptomCount = async (remedyName, db) => {
    const symptoms = await getAllSymptomsWithOverrides(remedyName, db);
    const count = symptoms.length;

    const easyCount = symptoms.filter(s => (s.difficulty || 1) === 1).length;
    const mediumCount = symptoms.filter(s => (s.difficulty || 1) === 2).length;
    const hardCount = symptoms.filter(s => (s.difficulty || 1) === 3).length;

    return {
        count,
        easyCount,
        mediumCount,
        hardCount,
        easy: easyCount >= 4,
        medium: mediumCount >= 4,
        hard: hardCount >= 4
    };
};

