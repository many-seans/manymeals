import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChefHat, Sparkles, CalendarDays, ShoppingCart, Loader2 } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, session, loading, initializing } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle successful auth - redirect to home
  useEffect(() => {
    if (session && !loading) {
      setIsRedirecting(true);
      // Use hash-based routing
      const targetHash = window.location.hash || '#/';
      if (targetHash === '#/login' || targetHash === '') {
        window.location.hash = '#/';
      }
      setIsRedirecting(false);
    }
  }, [session, loading]);

  // Handle OAuth callback - let Supabase process the tokens
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Supabase automatically handles the OAuth callback via onAuthStateChange
      // This effect ensures we process any tokens in the URL hash
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('error'))) {
        // The onAuthStateChange listener in AuthContext will handle this
        // Just clean up the URL after processing
        if (hash.includes('access_token')) {
          // Wait for session to be established
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname + '#/');
          }, 100);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsRedirecting(true);
      await signInWithGoogle();
      // The page will redirect to Google, so we won't reach here
    } catch (error) {
      console.error('Sign in error:', error);
      setIsRedirecting(false);
    }
  };

  // Show loading spinner during initialization or auth redirect
  if (initializing || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl">
            <ChefHat className="w-11 h-11 text-white" />
          </div>
          <div className="flex items-center gap-2 text-emerald-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">{initializing ? 'Initializing...' : 'Signing you in...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // If already has session, show redirecting state
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl mb-4">
              <ChefHat className="w-11 h-11 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PrepSmart</h1>
            <p className="text-gray-500 mt-1 text-center text-sm">AI-powered meal planning & prep</p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-3 mb-10">
            {[
              { icon: Sparkles, label: 'AI Meal Plans', desc: 'Personalized by your goals & preferences' },
              { icon: CalendarDays, label: 'Weekly Planner', desc: 'Organize meals for the whole week' },
              { icon: ShoppingCart, label: 'Smart Shopping', desc: 'Auto-generated grocery lists' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || isRedirecting}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading || isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
