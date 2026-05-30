import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, MealPlan } from '../lib/supabase';
import { Sparkles, CalendarDays, ShoppingCart, ChevronRight, Clock, Flame } from 'lucide-react';

type Page = 'home' | 'planner' | 'generate' | 'shopping' | 'profile';

type Props = { onNavigate: (page: Page) => void };

export default function Home({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [recentPlans, setRecentPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentPlans(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-gray-500 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}!</h1>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Sparkles, label: 'Generate Plan', color: 'bg-emerald-600', page: 'generate' as Page },
          { icon: CalendarDays, label: 'Weekly View', color: 'bg-teal-600', page: 'planner' as Page },
          { icon: ShoppingCart, label: 'Shopping', color: 'bg-cyan-600', page: 'shopping' as Page },
        ].map(({ icon: Icon, label, color, page }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`${color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all duration-150`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-semibold text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <img
          src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600"
          alt="Meal prep"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">AI-Powered</p>
          <h2 className="text-xl font-bold mb-2">Ready to meal prep?</h2>
          <p className="text-emerald-100 text-sm mb-4">Generate a personalized plan based on your dietary goals and preferences.</p>
          <button
            onClick={() => onNavigate('generate')}
            className="bg-white text-emerald-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all duration-150 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Now
          </button>
        </div>
      </div>

      {/* Recent meal plans */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Recent Plans</h2>
          <button onClick={() => onNavigate('generate')} className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : recentPlans.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No meal plans yet.</p>
            <button onClick={() => onNavigate('generate')} className="text-emerald-600 text-sm font-semibold mt-1">Generate your first plan</button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChefHatIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{plan.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {plan.meals?.length ?? 0} meals
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Meal Prep Tip</p>
        <p className="text-sm text-amber-800">Batch cook grains like quinoa and rice on Sundays — they keep for 5 days and are ready for any meal.</p>
      </div>
    </div>
  );
}

function ChefHatIcon() {
  return (
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  );
}
