import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jwiudgxsyvvuofkzymmv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_qBXMLECj6_jRhW38HW2SAQ_Yre2iuI-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export type Record = {
  id: string
  name: string
  phone: string
  amount: number
  date: string
  time: string
  notes: string
  reference_number: string
  status: string
  image_url: string
  created_at: string
}

export type NewRecord = Omit<Record, 'id' | 'created_at'>
