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
    console.error('Supabase client is null');
    throw new Error('Supabase не настроен: клиент не инициализирован');
  }

  console.log('Attempting to upload to Supabase Storage...');
  console.log('Bucket: astrinn-photos');
  console.log('File name:', fileName);
  console.log('MIME type:', mimeType);
  console.log('Buffer size:', buffer.length, 'bytes');

  const timestamp = Date.now();
  const filePath = `photos/${timestamp}-${fileName}`;

  console.log('File path:', filePath);

  const { data, error } = await supabase.storage
    .from('astrinn-photos')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    console.error('Error code:', error.statusCode);
    console.error('Error message:', error.message);
    
    // Более детальное сообщение об ошибке
    if (error.message.includes('Bucket') || error.message.includes('not found')) {
      throw new Error(`Bucket 'astrinn-photos' не найден в Supabase Storage. Создайте bucket в Supabase Dashboard: Storage → New bucket → имя: astrinn-photos → Public bucket: ON`);
    } else if (error.message.includes('new row violates row-level security')) {
      throw new Error(`Ошибка прав доступа. Убедитесь, что bucket 'astrinn-photos' публичный (Public bucket = ON) в Supabase Storage`);
    } else {
      throw new Error(`Ошибка загрузки в Supabase: ${error.message}. Проверьте, что bucket 'astrinn-photos' создан и публичный.`);
    }
  }

  console.log('Upload successful, getting public URL...');

  // Получаем публичный URL
  const { data: urlData } = supabase.storage
    .from('astrinn-photos')
    .getPublicUrl(filePath);

  console.log('Public URL:', urlData.publicUrl);

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

