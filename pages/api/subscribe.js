import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return res.status(500).json({ error: 'Server not configured' })
  }

  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  try {
    // No .select() here: RLS now blocks anon reads on `emails`, and we don't
    // need the inserted row back. This keeps the public signup working with
    // the insert-only policy.
    const { error } = await supabase
      .from('emails')
      .insert([{ email }])

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
