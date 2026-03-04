/**
 * upload_aconite.mjs
 * One-time script to upload Aconite easy-level card images to Firebase Storage
 * and create the corresponding customSymptoms documents in Firestore.
 *
 * Run with: node upload_aconite.mjs
 * Requires: npm install firebase (already installed in knote-app, we use it from there)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import readline from 'readline';

// ── Firebase config (same as in src/lib/firebase.js) ────────────────────────
const firebaseConfig = {
    apiKey: 'AIzaSyANzJq_Kbbrbkf_DyTPUHUiNDY2ocM5uJI',
    authDomain: 'knote-game.firebaseapp.com',
    projectId: 'knote-game',
    storageBucket: 'knote-game.firebasestorage.app',
    messagingSenderId: '1073978487442',
    appId: '1:1073978487442:web:33bd8f24ac05ca29f6ec4b',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// ── Image → Symptom mapping ──────────────────────────────────────────────────
const ARTIFACTS_DIR = 'C:/Users/Anurag/.gemini/antigravity/brain/aa116520-a833-415f-bc91-1bee4f3a53e8';

const SYMPTOMS = [
    {
        filename: 'media__1772659444553.png',
        text: 'Mind feels as if lifted in the air',
        emoji: '🌤️',
    },
    {
        filename: 'aconite_fear_anxiety_v2_1772659860022.png',
        text: 'Great fear and anxiety of mind, with great nervous excitability',
        emoji: '😱',
    },
    {
        filename: 'aconite_atmospheric_changes_v2_1772659877694.png',
        text: 'Persons easily affected by atmospheric changes',
        emoji: '🌦️',
    },
    {
        filename: 'aconite_dark_hair_eyes_v2_1772659891150.png',
        text: 'Dark hair and eyes, rigid muscular fibre',
        emoji: '💪',
    },
    {
        filename: 'aconite_cold_dry_air_v2_1772659921260.png',
        text: 'Complaints caused by exposure to dry cold air, dry north or west winds',
        emoji: '🥶',
    },
    {
        filename: 'aconite_checked_perspiration_v2_1772659936430.png',
        text: 'Bad effects of checked perspiration',
        emoji: '🌡️',
    },
    {
        filename: 'aconite_afraid_crowd_v2_1772659951521.png',
        text: 'Afraid to go out, to go into a crowd',
        emoji: '😨',
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function uploadSymptom(sym, adminEmail) {
    const filePath = resolve(ARTIFACTS_DIR, sym.filename);
    const fileBuffer = readFileSync(filePath);
    const storageRef = ref(storage, `aconite-easy/${sym.filename}`);

    console.log(`  📤 Uploading: ${sym.filename}`);
    await uploadBytes(storageRef, fileBuffer, { contentType: 'image/png' });
    const imageUrl = await getDownloadURL(storageRef);
    console.log(`  ✅ Uploaded → ${imageUrl.slice(0, 80)}...`);

    const docRef = await addDoc(collection(db, 'customSymptoms'), {
        remedyName: 'Aconite nap',
        text: sym.text,
        emoji: sym.emoji,
        imageUrl,
        difficulty: 1,         // Easy
        isActive: true,
        createdBy: adminEmail,
        createdAt: new Date().toISOString(),
    });
    console.log(`  📝 Firestore doc created: ${docRef.id}\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🌿 Aconite Easy Level — Image Upload Script\n');

    const email = await ask('Enter your admin Firebase email: ');
    const password = await ask('Enter your password: ');

    console.log('\n🔐 Signing in...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Signed in!\n');

    for (const sym of SYMPTOMS) {
        await uploadSymptom(sym, email);
    }

    console.log('🎉 All 7 Aconite Easy symptoms uploaded successfully!');
    console.log('   You can now launch the game and play Aconite → Easy.');
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
