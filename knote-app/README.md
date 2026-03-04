# Knote (React + Vite)

This is the React/Vite version of the **Knote** materia medica memory game.

## Login / Progress Saving (Firebase)

- **Auth**: Firebase Email/Password
- **Progress**: Firestore `users/{uid}` with `unlockedRemedies` array

To use your own Firebase project:

1. Copy `env.example` → `.env.local`
2. Fill in the `VITE_FIREBASE_*` values from Firebase Console
3. In Firebase Console, enable **Authentication → Email/Password**
4. Create Firestore (test mode is OK for local dev)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
