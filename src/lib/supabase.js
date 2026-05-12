import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate config — app falls back to simulation mode if missing
const isValidConfig = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl !== 'https://your-project-id.supabase.co' &&
                     supabaseAnonKey !== 'your-anon-key';

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }) 
  : null;

export const IS_SIMULATED = !isValidConfig;

if (!isValidConfig) {
  console.log('🚀 TaskMate: No Supabase credentials. Running in Simulation Mode.');
  console.log('   → Copy .env.example to .env and add your credentials to connect.');
}

// ── Storage helpers ───────────────────────────────────────

/**
 * Upload a file to a Supabase Storage bucket.
 * @param {string} bucket - bucket name (avatars, job-images, etc.)
 * @param {string} path - storage path (e.g. "user-id/filename.jpg")
 * @param {File} file - the File object to upload
 * @returns {Promise<string>} public URL of the uploaded file
 */
export async function uploadFile(bucket, path, file) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { 
      cacheControl: '3600', 
      upsert: true 
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(bucket, path) {
  if (!supabase) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error('Delete file error:', error);
}

/**
 * Generate a unique file path for uploads.
 */
export function generateFilePath(userId, fileName) {
  const ext = fileName.split('.').pop();
  const timestamp = Date.now();
  return `${userId}/${timestamp}.${ext}`;
}

export default supabase;
