// Relative import from utils folder to the lib directory where the Supabase
// client is created. We don't currently have a path alias set up, so use a
// relative path instead. The file itself is JavaScript, but TypeScript can
// import it just fine.
import { supabase } from '../lib/supabase'

export type Deal = {
  id: string
  title: string
  description: string
  price: number
  link: string
  user_id: string
  restaurant_id: string // foreign key to a restaurant (place_id)
  created_at: string
}

export async function createDeal(input: {
  title: string
  description: string
  price: number
  link: string
  restaurant_id: string // must supply a restaurant identifier
}) {
  const { data, error } = await supabase
    .from('deals')
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error('Error creating deal:', error)
    throw error
  }

  return data as Deal
}

export async function getDeals() {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Deal[]
}