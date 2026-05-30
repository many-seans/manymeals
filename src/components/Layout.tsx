import { ReactNode } from 'react';
import { ChefHat, Home, CalendarDays, ShoppingCart, Sparkles, User } from 'lucide-react';

type Page = 'home' | 'planner' | 'generate' | 'shopping' | 'profile';

type LayoutProps = {
  children: ReactNode;
  page: Page;
  onNavigate: (page: Page) => void;
};

const navItems: { id: Page; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'planner', icon: CalendarDays, label: 'Planner' },
  { id: 'generate', icon: Sparkles, label: 'Generate' },
  { id: 'shopping', icon: ShoppingCart, label: 'Shopping' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function Layout({ children, page, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
          <ChefHat className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">PrepSmart</span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 shadow-lg z-50">
        <div className="flex">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150 ${
                page === id ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-150 ${page === id ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
