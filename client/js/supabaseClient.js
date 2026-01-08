import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://eliryuasilkwdkqrxlkn.supabase.co'
const supabaseKey = 'sb_publishable_6jSZCdsPthQZU0tKGz4Hzg_zakDZ1QW'
export const supabase = createClient(supabaseUrl, supabaseKey)