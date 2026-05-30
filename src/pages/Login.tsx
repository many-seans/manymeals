import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChefHat, Mail, Lock, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';

type AuthMode = 'login' | 'signup';

export default function Login() {
  const {
    session,
    loading,
    initializing,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showSuccess, setShowSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session && !loading && !initializing) {
      // Clean up URL hash if coming from OAuth callback
      const hash = window.location.hash;
      if (hash.includes('access_token') || hash.includes('error')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      // Redirect to home/dashboard
      window.location.hash = '#/';
    }
  }, [session, loading, initializing]);

  // Clean up OAuth callback URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('error_description'))) {
      // Let onAuthStateChange handle the tokens, then clean URL
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setShowSuccess('');

    if (!email.trim()) {
      return;
    }

    if (!password || password.length < 6) {
      return;
    }

    if (mode === 'signup') {
      const result = await signUpWithEmail(email, password, fullName.trim() || undefined);
      if (result.success) {
        if (result.error) {
          // Email confirmation required
          setShowSuccess(result.error);
        }
      }
    } else {
      await signInWithEmail(email, password);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearError();
    try {
      await signInWithGoogle();
      // Will redirect to Google, so loading stays true
    } catch {
      setGoogleLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    setShowSuccess('');
    setPassword('');
  };

  // Show loading during initialization
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl">
            <ChefHat className="w-11 h-11 text-white" />
          </div>
          <div className="flex items-center gap-2 text-emerald-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't show login if already authenticated
  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-gray-600 font-medium">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl mb-3">
              <ChefHat className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PrepSmart</h1>
            <p className="text-gray-500 text-sm mt-1">AI-powered meal planning</p>
          </div>

          {/* Auth form card */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <div className="flex mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-start gap-3 bg-red-50 text-red-700 rounded-xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}

            {/* Success message */}
            {showSuccess && (
              <div className="mb-4 flex items-start gap-3 bg-green-50 text-green-700 rounded-xl p-3 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{showSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name field (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                    Full Name (optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !email.trim() || password.length < 6}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-gray-100" />
              <span className="px-3 text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            {/* Google sign in button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Toggle mode link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={switchMode} className="text-emerald-600 font-semibold hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={switchMode} className="text-emerald-600 font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
