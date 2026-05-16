export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  // Log to console for now (will integrate Supabase later)
  console.log(`📧 New signup: ${email}`)

  // TODO: Save to Supabase
  // const { data, error } = await supabase
  //   .from('emails')
  //   .insert([{ email }])

  return res.status(200).json({ success: true, message: 'Email saved' })
}
