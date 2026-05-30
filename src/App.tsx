import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import MealPlanGenerator from './pages/MealPlanGenerator';
import WeeklyPlanner from './pages/WeeklyPlanner';
import ShoppingList from './pages/ShoppingList';
import Profile from './pages/Profile';

type Page = 'home' | 'planner' | 'generate' | 'shopping' | 'profile';

const VALID_PAGES: Page[] = ['home', 'planner', 'generate', 'shopping', 'profile'];

function AppInner() {
  const { session, loading, initializing } = useAuth();
  const [page, setPage] = useState<Page>('home');

  // Sync page state with URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').replace('/', '') || 'home';
    if (VALID_PAGES.includes(hash as Page)) {
      setPage(hash as Page);
    }
  }, []);

  // Update hash when page changes
  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.location.hash = `/${p}`;
  }, []);

  // Show loading during initial auth check
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading PrepSmart...</p>
        </div>
      </div>
    );
  }

  // Show login if no session
  if (!session) {
    return <Login />;
  }

  // Main app
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
