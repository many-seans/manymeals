import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, MealPlan, WeeklyPlanner as WeeklyPlannerType } from '../lib/supabase';
import { CalendarDays, ChevronLeft, ChevronRight, Save, Plus, X } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
type Day = typeof DAYS[number];
type MealType = typeof MEAL_TYPES[number];

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekRange(monday: Date) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export default function WeeklyPlanner() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [plan, setPlan] = useState<Partial<Record<Day, Partial<Record<MealType, string>>>>>({});
  const [savedPlans, setSavedPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modal, setModal] = useState<{ day: Day; meal: MealType } | null>(null);
  const [inputVal, setInputVal] = useState('');

  const weekKey = weekStart.toISOString().split('T')[0];

  useEffect(() => {
    loadWeekPlan();
    loadMealPlans();
  }, [weekKey]);

  async function loadWeekPlan() {
    setLoading(true);
    const { data } = await supabase
      .from('weekly_planner')
      .select('*')
      .eq('week_start', weekKey)
      .maybeSingle();
    setPlan((data as WeeklyPlannerType | null)?.plan ?? {});
    setLoading(false);
  }

  async function loadMealPlans() {
    const { data } = await supabase.from('meal_plans').select('id, title, meals').order('created_at', { ascending: false });
    setSavedPlans(data ?? []);
  }

  async function savePlan() {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('weekly_planner')
      .upsert({ user_id: user.id, week_start: weekKey, plan, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week_start' });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function openModal(day: Day, meal: MealType) {
    setInputVal(plan[day]?.[meal] ?? '');
    setModal({ day, meal });
  }

  function saveCell() {
    if (!modal) return;
    setPlan(prev => ({
      ...prev,
      [modal.day]: { ...prev[modal.day], [modal.meal]: inputVal },
    }));
    setModal(null);
  }

  function clearCell(day: Day, meal: MealType) {
    setPlan(prev => {
      const updated = { ...prev };
      if (updated[day]) {
        const dayPlan = { ...updated[day] };
        delete dayPlan[meal];
        updated[day] = dayPlan;
      }
      return updated;
    });
  }

  const allMealNames = savedPlans.flatMap(p => (p.meals ?? []).map(m => m.name)).filter(Boolean);
  const suggestions = allMealNames.filter(n => n.toLowerCase().includes(inputVal.toLowerCase()) && inputVal.length > 0).slice(0, 5);

  return (
    <div className="px-5 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Planner</h1>
        <button
          onClick={savePlan}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            saveSuccess ? 'bg-green-100 text-green-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Week nav */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between px-4 py-3">
        <button onClick={prevWeek} className="p-1 text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-900">{formatWeekRange(weekStart)}</span>
        </div>
        <button onClick={nextWeek} className="p-1 text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Planner grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day, idx) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + idx);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={day} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isToday ? 'border-emerald-300' : 'border-gray-100'}`}>
                <div className={`px-4 py-2 flex items-center gap-2 ${isToday ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                  {isToday && <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">Today</span>}
                  <span className="text-xs text-gray-400 ml-auto">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {MEAL_TYPES.map(mealType => {
                    const value = plan[day]?.[mealType];
                    return (
                      <div key={mealType} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-xs font-semibold text-gray-400 w-16 capitalize flex-shrink-0">{mealType}</span>
                        {value ? (
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs text-gray-800 flex-1 truncate">{value}</span>
                            <button onClick={() => clearCell(day, mealType)} className="text-gray-300 hover:text-red-400 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openModal(day, mealType)}
                            className="flex-1 flex items-center gap-1 text-xs text-gray-300 hover:text-emerald-600 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add meal
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 capitalize">{modal.meal} — {modal.day}</h3>
            <input
              autoFocus
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Type a meal name..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={e => e.key === 'Enter' && saveCell()}
            />
            {suggestions.length > 0 && (
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInputVal(s); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveCell} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
