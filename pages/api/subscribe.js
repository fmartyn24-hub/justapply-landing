import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zvodxljkfvwarcljerau.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b2R4bGprZnZ3YXJjbGplcmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjQzMDcsImV4cCI6MjA5NDU0MDMwN30.Hne1sGhgR_oE-xa7VkBS9a5OfN-0LSNTH89ksjY49Cg'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  try {
    const { data, error } = await supabase
      .from('emails')
      .insert([{ email }])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      // If email already exists, that's fine
      if (error.code === '23505') {
        return res.status(200).json({ success: true, message: 'Email already subscribed' })
      }
      return res.status(400).json({ error: error.message })
    }

    console.log(`📧 New signup: ${email}`)
    return res.status(200).json({ success: true, message: 'Email saved to database' })
  } catch (err) {
    console.error('Error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
