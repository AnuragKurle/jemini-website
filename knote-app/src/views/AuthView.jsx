import React, { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { playSound } from '../lib/audio.js';
import Button from '../components/Button.jsx';

const AuthView = () => {
  const { login, signup, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (showForgotPassword) {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        setEmail('');
      } else if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      if (!showForgotPassword) {
        playSound('win');
      }
    } catch (err) {
      setError(err?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in relative z-20 p-4">
      <div className="bg-white p-8 rounded-full shadow-2xl flex flex-col items-center justify-center w-40 h-40 z-10 border-4 border-blue-50">
        <h1 className="text-5xl font-serif text-red-500 font-bold">
          K<span className="text-black font-handwriting font-normal">note</span>
        </h1>
      </div>

      <div className="w-full max-w-sm glass-premium rounded-3xl p-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          {showForgotPassword ? 'Reset Password' : isLogin ? 'Login' : 'Sign Up'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {!showForgotPassword && (
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
          {!isLogin && !showForgotPassword && (
            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isFullWidth
            isLoading={submitting}
          >
            {showForgotPassword ? 'Send Reset Email' : isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          isFullWidth
          className="mt-4"
          onClick={() => {
            playSound('tap');
            if (showForgotPassword) {
              setShowForgotPassword(false);
            } else {
              setIsLogin((v) => !v);
            }
            setDisplayName('');
            setError('');
            setSuccess('');
          }}
        >
          {showForgotPassword ? 'Back to Login' : isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
        </Button>

        {isLogin && !showForgotPassword && (
          <Button
            type="button"
            variant="ghost"
            isFullWidth
            className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            onClick={() => {
              setShowForgotPassword(true);
              setError('');
              setSuccess('');
            }}
          >
            Forgot password?
          </Button>
        )}
      </div>
    </div>
  );
};

export default AuthView;
