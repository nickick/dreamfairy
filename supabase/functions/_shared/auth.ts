import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1'

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

export async function requireAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: 'No authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    throw new Response(
      JSON.stringify({ error: 'No token provided' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321'
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role
  }
}