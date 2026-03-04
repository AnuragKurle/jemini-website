# Firebase Setup Guide for Knote

This guide will walk you through setting up Firebase for your Knote game.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "knote-game")
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`)
2. Register app nickname: "Knote Web App"
3. **Do NOT** check "Also set up Firebase Hosting" (we'll do this later)
4. Click "Register app"
5. **Copy the `firebaseConfig` object** - you'll need this!

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "knote-game.firebaseapp.com",
  projectId: "knote-game",
  storageBucket: "knote-game.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 3: Update knote-firebase.html

1. Open `knote-firebase.html`
2. Find this section (around line 189):
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```
3. **Replace it** with the config you copied from Firebase Console
4. Save the file

## Step 4: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on "Email/Password" provider
4. **Enable** the first toggle (Email/Password)
5. Click "Save"

## Step 5: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **Start in test mode** (for development)
   - Warning: Test mode allows anyone to read/write. We'll secure it later.
4. Choose a location (closest to your users)
5. Click "Enable"

## Step 6: Set Firestore Security Rules (Optional but Recommended)

1. In Firestore, click on the "Rules" tab
2. Replace the rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Click "Publish"

This ensures users can only access their own data.

## Step 7: Test Locally

1. Open `knote-firebase.html` in your browser (just double-click the file)
2. You should see the Login/Signup screen
3. Create a test account
4. Play the game and complete a level
5. Logout and login again - your progress should be saved!

## Step 8: Deploy to Firebase Hosting (Optional)

Once you've tested locally, you can deploy to the web:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. In your `jemini website` directory, initialize hosting:
```bash
firebase init hosting
```
- Select your Firebase project
- Set public directory: `.` (current directory)
- Configure as single-page app: **No**
- Don't overwrite `knote-firebase.html`

4. Deploy:
```bash
firebase deploy --only hosting
```

5. Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

## Troubleshooting

### "Firebase not defined"
- Make sure your internet connection is active (Firebase SDKs are loaded from CDN)

### Authentication not working
- Check that Email/Password is enabled in Firebase Console
- Check browser console for errors

### Data not saving
- Verify Firestore is created and rules are set
- Check browser console for permission errors

### Build/Deploy errors
- Make sure you've run `firebase login` first
- Ensure you selected the correct project during `firebase init`

## Next Steps

- Add more remedies with different card sets
- Customize the Firestore security rules
- Add password reset functionality
- Implement difficulty levels (Easy/Medium/Hard) with different card counts
