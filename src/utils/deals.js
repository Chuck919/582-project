import { supabase } from '../lib/supabase'

/**
 * @typedef {Object} Deal
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} price
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
  const { data, error } = await supabase.from('deals').select('*');

  if (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }

  const dealsByRestaurant = {};
  data.forEach((deal) => {
    if (!dealsByRestaurant[deal.restaurant_id]) {
      dealsByRestaurant[deal.restaurant_id] = [];
    }
    dealsByRestaurant[deal.restaurant_id].push(deal);
  });

  return dealsByRestaurant;
}
