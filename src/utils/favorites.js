import { supabase } from '../lib/supabase';

/**
 * Fetch all favorites for a user, joined with restaurant data.
 * Requires a `favorites` table with columns:
 *   id, user_id, restaurant_id, created_at
 * and a foreign-key relationship to the `restaurants` table.
 *
 * Supabase setup (run once in the SQL editor):
 *   CREATE TABLE favorites (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *     restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     UNIQUE(user_id, restaurant_id)
 *   );
 *   ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users manage own favorites" ON favorites
 *     FOR ALL USING (auth.uid() = user_id);
 */
export async function fetchFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      restaurant_id,
      created_at,
      restaurants (
        id,
        name,
        cuisine,
        rating
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addFavorite(userId, restaurantId) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, restaurant_id: restaurantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFavorite(userId, restaurantId) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);

  if (error) throw error;
}

export async function checkIsFavorite(userId, restaurantId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant_id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
