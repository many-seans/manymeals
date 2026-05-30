import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import MealPlanGenerator from './pages/MealPlanGenerator';
import WeeklyPlanner from './pages/WeeklyPlanner';
import ShoppingList from './pages/ShoppingList';
import Profile from './pages/Profile';
import { ChefHat, Loader2 } from 'lucide-react';

type Page = 'home' | 'planner' | 'generate' | 'shopping' | 'profile';

const VALID_PAGES: Page[] = ['home', 'planner', 'generate', 'shopping', 'profile'];

function AppInner() {
  const { session, loading, initializing } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [navigated, setNavigated] = useState(false);

  // Sync page state with URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').replace('/', '') || '';
    if (hash && VALID_PAGES.includes(hash as Page)) {
      setPage(hash as Page);
    }
    setNavigated(true);
  }, []);

  // Update hash when page changes
  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.location.hash = `/${p}`;
  }, []);

  // Show splash/loading during initial auth check
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
            <ChefHat className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2 text-emerald-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Loading PrepSmart...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login if no session (redirects handled inside Login component)
  if (!session) {
    return <Login />;
  }

  // Main app - protected routes
  return (
    <Layout page={page} onNavigate={navigate}>
      {page === 'home' && <Home onNavigate={navigate} />}
      {page === 'generate' && <MealPlanGenerator onNavigate={navigate} />}
      {page === 'planner' && <WeeklyPlanner />}
      {page === 'shopping' && <ShoppingList />}
      {page === 'profile' && <Profile />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
