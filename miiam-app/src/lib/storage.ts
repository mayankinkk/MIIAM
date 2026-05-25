import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function uploadFile(fileBuffer: Buffer, destination: string, mimeType: string): Promise<string> {
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
