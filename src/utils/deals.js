// Relative import from utils folder to the lib directory where the Supabase
// client is created. We don't currently have a path alias set up, so use a
// relative path instead. The file itself is JavaScript, but TypeScript can
// import it just fine.
import { supabase } from '../lib/supabase'

/**
 * @typedef {Object} Deal
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} price
 * @property {string} link
 * @property {string} user_id
 * @property {string} restaurant_id - foreign key to a restaurant (place_id)
 * @property {string} created_at
 */

export async function createDeal(input) {
  const { data, error } = await supabase
    .from('deals')
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error('Error creating deal:', error)
    throw error
  }

  return data
}

export async function fetchDeals() {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*');

    if (error) {
      console.error('Error fetching deals:', error);
      throw new Error('Failed to fetch deals');
    }

    const dealsByRestaurant = {};
    data.forEach((deal) => {
      if (!dealsByRestaurant[deal.restaurant_id]) {
        dealsByRestaurant[deal.restaurant_id] = [];
      }
      dealsByRestaurant[deal.restaurant_id].push(deal);
    });

    return dealsByRestaurant;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}