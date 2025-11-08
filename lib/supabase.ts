import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Используем service_role ключ для серверной загрузки
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase не настроен. Добавьте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в переменные окружения.');
  console.warn('ВАЖНО: Используйте service_role ключ, а не anon ключ!');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export async function uploadToSupabase(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase не настроен');
  }

  const timestamp = Date.now();
  const filePath = `photos/${timestamp}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('astrinn-photos')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Ошибка загрузки в Supabase: ${error.message}`);
  }

  // Получаем публичный URL
  const { data: urlData } = supabase.storage
    .from('astrinn-photos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteFromSupabase(filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase не настроен');
  }

  const { error } = await supabase.storage
    .from('astrinn-photos')
    .remove([filePath]);

  if (error) {
    throw new Error(`Ошибка удаления из Supabase: ${error.message}`);
  }
}

export function isSupabaseConfigured(): boolean {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (hasUrl && !hasKey) {
    console.warn('Supabase URL настроен, но отсутствует SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!hasUrl && hasKey) {
    console.warn('Supabase ключ настроен, но отсутствует NEXT_PUBLIC_SUPABASE_URL');
  }
  
  return hasUrl && hasKey;
}

