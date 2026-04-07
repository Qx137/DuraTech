
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wutfcyskvfkunmvrvafz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGZjeXNrdmZrdW5tdnJ2YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTg0NzAsImV4cCI6MjA2ODI3NDQ3MH0.R0ogVNfrpZJUV9SK2J2ZjdGU8a6_lyx_UxX-vDOdSQ4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log('Latest Orders:')
  console.log(JSON.stringify(data, null, 2))
}

checkOrders()
