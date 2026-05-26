import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

function getServerSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return supabaseInstance
}

export async function uploadFile(fileBuffer: Buffer, destination: string, mimeType: string): Promise<string> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.storage.from('uploads').upload(destination, fileBuffer, {
    contentType: mimeType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(destination)
  return publicUrl
}
