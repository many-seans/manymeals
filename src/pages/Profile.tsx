import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOneSignal } from '../hooks/useOneSignal';
import { supabase } from '../lib/supabase';
import { User, Bell, LogOut, Save, ChevronRight, Target, Utensils } from 'lucide-react';

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'Nut-Free'];

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { requestPushPermission } = useOneSignal();
  const [fullName, setFullName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [dietary, setDietary] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'loading' | 'enabled'>('idle');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setCalorieGoal(profile.calorie_goal?.toString() ?? '2000');
      setDietary(profile.dietary_preferences ?? []);
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: fullName,
      calorie_goal: parseInt(calorieGoal) || 2000,
      dietary_preferences: dietary,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  async function enableNotifications() {
    setNotifStatus('loading');
    await requestPushPermission();
    setNotifStatus('enabled');
  }

  function toggleDietary(opt: string) {
    setDietary(prev =>
      prev.includes(opt) ? prev.filter(d => d !== opt) : [...prev, opt]
    );
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const email = user?.email ?? '';

  return (
    <div className="px-5 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* Avatar & email */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-50" />
        ) : (
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-9 h-9 text-emerald-700" />
          </div>
        )}
        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg">{profile?.full_name || 'Your Name'}</p>
          <p className="text-gray-500 text-sm">{email}</p>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" /> Personal Details
        </h2>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
            <Target className="w-3 h-3" /> Daily Calorie Goal
          </label>
          <div className="relative">
            <input
              type="number"
              value={calorieGoal}
              onChange={e => setCalorieGoal(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kcal</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block flex items-center gap-1">
            <Utensils className="w-3 h-3" /> Dietary Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleDietary(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  dietary.includes(opt) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
            saveSuccess ? 'bg-green-100 text-green-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          } disabled:opacity-60`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Push Notifications</p>
              <p className="text-xs text-gray-500">Meal reminders & tips</p>
            </div>
          </div>
          {notifStatus === 'enabled' ? (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold">Enabled</span>
          ) : (
            <button
              onClick={enableNotifications}
              disabled={notifStatus === 'loading'}
              className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:underline disabled:opacity-60"
            >
              {notifStatus === 'loading' ? 'Enabling...' : 'Enable'} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { label: 'App Version', value: '1.0.0' },
          { label: 'Account Created', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm text-gray-400">{value}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 font-semibold py-4 rounded-2xl hover:bg-red-100 active:scale-[0.98] transition-all text-sm"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
