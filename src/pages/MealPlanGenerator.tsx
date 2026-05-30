import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, MealPlan, Meal } from '../lib/supabase';
import { Sparkles, ChevronDown, ChevronUp, Clock, Flame, Save, Trash2, ChevronRight, AlertCircle } from 'lucide-react';

type Page = 'home' | 'planner' | 'generate' | 'shopping' | 'profile';
type Props = { onNavigate: (p: Page) => void };

const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb'];
const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Heart Health', 'Energy Boost'];
const DAYS_OPTIONS = [3, 5, 7];

export default function MealPlanGenerator({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [savedPlans, setSavedPlans] = useState<MealPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Form state
  const [goal, setGoal] = useState('Maintenance');
  const [dietary, setDietary] = useState('None');
  const [days, setDays] = useState(5);
  const [calories, setCalories] = useState(profile?.calorie_goal?.toString() ?? '2000');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Generated plan
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [planTitle, setPlanTitle] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSavedPlans();
  }, []);

  async function loadSavedPlans() {
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .order('created_at', { ascending: false });
    setSavedPlans(data ?? []);
    setLoadingPlans(false);
  }

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    setError('');
    setGeneratedMeals([]);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ goal, dietary, days, calories: parseInt(calories) }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to generate meal plan');
      }

      const data = await res.json();
      setGeneratedMeals(data.meals ?? []);
      setPlanTitle(data.title ?? `${days}-Day ${goal} Plan`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!user || generatedMeals.length === 0) return;
    setSaving(true);
    const { error: err } = await supabase.from('meal_plans').insert({
      user_id: user.id,
      title: planTitle || `${days}-Day ${goal} Plan`,
      description: `${dietary !== 'None' ? dietary + ' • ' : ''}${calories} cal/day`,
      meals: generatedMeals,
    });
    setSaving(false);
    if (!err) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      loadSavedPlans();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('meal_plans').delete().eq('id', id);
    setSavedPlans(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="px-5 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AI Meal Planner</h1>

      {/* Config form */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Plan Settings</h2>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Goal</label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  goal === g ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Dietary Preference</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDietary(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  dietary === d ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Days</label>
            <div className="flex gap-2">
              {DAYS_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    days === d ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Calories/day</label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-xl p-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Meal Plan
            </>
          )}
        </button>
      </div>

      {/* Generated results */}
      {generatedMeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{planTitle}</h2>
              <p className="text-xs text-gray-500">{generatedMeals.length} meals generated</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                saveSuccess ? 'bg-green-100 text-green-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Plan'}
            </button>
          </div>

          {generatedMeals.map((meal, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4"
                onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{mealEmoji(meal.type)}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 text-sm">{meal.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500 capitalize">{meal.type}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5"><Flame className="w-3 h-3" />{meal.calories} kcal</span>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{(meal.prepTime ?? 0) + (meal.cookTime ?? 0)}m</span>
                  </div>
                </div>
                {expandedMeal === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {expandedMeal === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                  <div className="grid grid-cols-3 gap-2 pt-3">
                    {[
                      { label: 'Protein', value: `${meal.protein}g` },
                      { label: 'Carbs', value: `${meal.carbs}g` },
                      { label: 'Fat', value: `${meal.fat}g` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Ingredients</p>
                    <ul className="space-y-1">
                      {meal.ingredients?.map((ing, j) => (
                        <li key={j} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {meal.instructions && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Instructions</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{meal.instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Saved plans */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3">Saved Plans</h2>
        {loadingPlans ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : savedPlans.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No saved plans yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{plan.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.meals?.length ?? 0} meals • {new Date(plan.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function mealEmoji(type: string) {
  switch (type) {
    case 'breakfast': return '🌅';
    case 'lunch': return '☀️';
    case 'dinner': return '🌙';
    case 'snack': return '🍎';
    default: return '🍽️';
  }
}
