import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'prepsmart-auth',
  },
});

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  dietary_preferences: string[];
  calorie_goal: number;
  onesignal_player_id: string;
  created_at: string;
  updated_at: string;
};

export type MealPlan = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  meals: Meal[];
  week_start: string | null;
  created_at: string;
};

export type Meal = {
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string;
  prepTime: number;
  cookTime: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: string;
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  user_id: string;
  meal_plan_id: string | null;
  title: string;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
};

export type DayPlan = {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack?: string;
};

export type WeeklyPlan = {
  monday: DayPlan;
  tuesday: DayPlan;
  wednesday: DayPlan;
  thursday: DayPlan;
  friday: DayPlan;
  saturday: DayPlan;
  sunday: DayPlan;
};

export type WeeklyPlanner = {
  id: string;
  user_id: string;
  week_start: string;
  plan: Partial<WeeklyPlan>;
  created_at: string;
  updated_at: string;
};
