import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, ShoppingList as ShoppingListType, ShoppingItem, MealPlan } from '../lib/supabase';
import { ShoppingCart, Plus, Check, Trash2, ChevronDown, ChevronUp, Sparkles, X, Package } from 'lucide-react';

const CATEGORIES = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry', 'Frozen', 'Beverages', 'Other'];

export default function ShoppingList() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingListType[]>([]);
  const [activeList, setActiveList] = useState<ShoppingListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', qty: '1', unit: '', category: 'Other' });
  const [generating, setGenerating] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [{ data: ls }, { data: mp }] = await Promise.all([
      supabase.from('shopping_lists').select('*').order('created_at', { ascending: false }),
      supabase.from('meal_plans').select('id, title, meals').order('created_at', { ascending: false }),
    ]);
    const lists = ls ?? [];
    setLists(lists);
    setMealPlans(mp ?? []);
    if (lists.length > 0) setActiveList(lists[0]);
    setLoading(false);
  }

  async function createNewList(title = 'Shopping List') {
    if (!user) return;
    const { data } = await supabase
      .from('shopping_lists')
      .insert({ user_id: user.id, title, items: [] })
      .select()
      .single();
    if (data) {
      setLists(prev => [data, ...prev]);
      setActiveList(data);
    }
  }

  async function generateFromPlan(planId: string) {
    const plan = mealPlans.find(p => p.id === planId);
    if (!plan || !user) return;
    setGenerating(true);

    const ingredientMap = new Map<string, ShoppingItem>();
    plan.meals?.forEach(meal => {
      meal.ingredients?.forEach(ing => {
        const key = ing.toLowerCase().trim();
        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, {
            id: crypto.randomUUID(),
            name: ing,
            qty: 1,
            unit: '',
            category: guessCategory(ing),
            checked: false,
          });
        }
      });
    });

    const items = Array.from(ingredientMap.values());
    const { data } = await supabase
      .from('shopping_lists')
      .insert({ user_id: user.id, meal_plan_id: planId, title: `${plan.title} — Groceries`, items })
      .select()
      .single();

    if (data) {
      setLists(prev => [data, ...prev]);
      setActiveList(data);
    }
    setGenerating(false);
  }

  async function updateItems(items: ShoppingItem[]) {
    if (!activeList) return;
    const updated = { ...activeList, items };
    setActiveList(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    await supabase.from('shopping_lists').update({ items, updated_at: new Date().toISOString() }).eq('id', activeList.id);
  }

  function toggleItem(id: string) {
    if (!activeList) return;
    const items = activeList.items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    updateItems(items);
  }

  function addItem() {
    if (!activeList || !newItem.name.trim()) return;
    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newItem.name.trim(),
      qty: parseFloat(newItem.qty) || 1,
      unit: newItem.unit,
      category: newItem.category,
      checked: false,
    };
    updateItems([...activeList.items, item]);
    setNewItem({ name: '', qty: '1', unit: '', category: 'Other' });
    setShowAdd(false);
  }

  function removeItem(id: string) {
    if (!activeList) return;
    updateItems(activeList.items.filter(i => i.id !== id));
  }

  async function deleteList(id: string) {
    await supabase.from('shopping_lists').delete().eq('id', id);
    const remaining = lists.filter(l => l.id !== id);
    setLists(remaining);
    setActiveList(remaining[0] ?? null);
  }

  function toggleCategory(cat: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const grouped = CATEGORIES.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const items = (activeList?.items ?? []).filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const uncategorized = (activeList?.items ?? []).filter(i => !CATEGORIES.includes(i.category));
  if (uncategorized.length > 0) grouped['Other'] = [...(grouped['Other'] ?? []), ...uncategorized];

  const checkedCount = (activeList?.items ?? []).filter(i => i.checked).length;
  const totalCount = activeList?.items?.length ?? 0;

  return (
    <div className="px-5 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
        <button
          onClick={() => createNewList()}
          className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Generate from plan */}
      {mealPlans.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Generate from meal plan
          </p>
          <select
            className="w-full border border-emerald-200 bg-white rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            defaultValue=""
            onChange={e => e.target.value && generateFromPlan(e.target.value)}
          >
            <option value="" disabled>Select a meal plan...</option>
            {mealPlans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          {generating && (
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700">
              <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Generating shopping list...
            </div>
          )}
        </div>
      )}

      {/* List selector */}
      {lists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => setActiveList(list)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeList?.id === list.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {list.title}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : !activeList ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No shopping lists yet</p>
          <p className="text-gray-400 text-xs mt-1">Create one or generate from a meal plan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900">{activeList.title}</h2>
              <button onClick={() => deleteList(activeList.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{checkedCount}/{totalCount}</span>
            </div>
          </div>

          {/* Items by category */}
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
              <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No items yet. Add some below!</p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100"
                >
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{items.filter(i => i.checked).length}/{items.length}</span>
                    {expandedCats.has(cat) ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </button>
                {expandedCats.has(cat) && (
                  <div className="divide-y divide-gray-50">
                    {items.map(item => (
                      <div key={item.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${item.checked ? 'bg-gray-50' : ''}`}>
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                          }`}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          {(item.qty || item.unit) && (
                            <span className="text-xs text-gray-400 ml-1.5">{item.qty} {item.unit}</span>
                          )}
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add item */}
          {showAdd ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Add Item</h3>
              <input
                autoFocus
                value={newItem.name}
                onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Item name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newItem.qty}
                  onChange={e => setNewItem(prev => ({ ...prev, qty: e.target.value }))}
                  placeholder="Qty"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  value={newItem.unit}
                  onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Unit (e.g. lbs)"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={newItem.category}
                onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={addItem} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold">Add</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 rounded-2xl py-4 text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function guessCategory(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  if (/chicken|beef|pork|fish|salmon|tuna|shrimp|turkey|lamb|egg|tofu/.test(lower)) return 'Protein';
  if (/milk|cheese|yogurt|butter|cream|ghee/.test(lower)) return 'Dairy';
  if (/rice|pasta|bread|flour|oat|quinoa|barley|noodle/.test(lower)) return 'Grains';
  if (/apple|banana|orange|spinach|lettuce|tomato|onion|garlic|pepper|broccoli|carrot|zucchini|avocado|berry|lemon/.test(lower)) return 'Produce';
  if (/frozen/.test(lower)) return 'Frozen';
  if (/juice|water|coffee|tea|soda/.test(lower)) return 'Beverages';
  if (/oil|salt|pepper|spice|sauce|vinegar|sugar|honey|stock|broth|can|canned/.test(lower)) return 'Pantry';
  return 'Other';
}
