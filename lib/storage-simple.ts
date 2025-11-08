// Простое хранилище для небольшого количества фотографий (до 200 штук)
// Использует различные варианты в зависимости от доступности
// Приоритет: Netlify Blobs (локально на сайте) > Supabase > Cloudinary > локальное хранилище

import { uploadToNetlify, isNetlifyConfigured } from './storage-netlify';
import { uploadToSupabase, isSupabaseConfigured } from './supabase';
import { uploadToCloudinary, isCloudinaryConfigured } from './cloudinary';

export interface StorageResult {
  url: string;
  id: string;
  provider: 'netlify' | 'supabase' | 'cloudinary' | 'local';
}

export async function uploadPhoto(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
  const timestamp = Date.now();
  
  // Диагностика: проверяем какие переменные есть
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabaseUrl = !!supabaseUrl;
  const hasSupabaseKey = !!supabaseKey;
  const hasCloudinaryName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasCloudinaryKey = !!process.env.CLOUDINARY_API_KEY;
  const hasCloudinarySecret = !!process.env.CLOUDINARY_API_SECRET;
  
  console.log('=== Storage configuration check ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Netlify:', isNetlifyConfigured() ? 'AVAILABLE' : 'NOT AVAILABLE');
  console.log('Supabase URL:', hasSupabaseUrl ? `${supabaseUrl?.substring(0, 30)}...` : 'NOT SET');
  console.log('Supabase Key:', hasSupabaseKey ? `${supabaseKey?.substring(0, 20)}...` : 'NOT SET');
  console.log('Cloudinary Name:', hasCloudinaryName ? 'SET' : 'NOT SET');
  console.log('Cloudinary Key:', hasCloudinaryKey ? 'SET' : 'NOT SET');
  console.log('Cloudinary Secret:', hasCloudinarySecret ? 'SET' : 'NOT SET');
  
  // В production на Netlify используем Netlify Blobs (локальное хранилище на сайте Netlify)
  // В development используем локальную файловую систему
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.NETLIFY_DEV) {
    // На Netlify используем Netlify Blobs
    if (isNetlifyConfigured()) {
      console.log('Attempting Netlify Blobs upload (локальное хранилище на сайте Netlify)...');
      try {
        const result = await uploadToNetlify(buffer, fileName, mimeType);
        console.log('Netlify Blobs upload successful:', result.url);
        return result;
      } catch (error: any) {
        console.error('Netlify Blobs upload failed:', error);
        console.error('Error details:', error.message);
        // Пробуем резервные варианты
      }
    }
  }
  
  // В development используем локальное хранилище
  if (process.env.NODE_ENV === 'development') {
    console.log('Using local file storage (development)...');
    try {
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const fs = await import('fs');
      
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = join(uploadsDir, `${timestamp}-${fileName}`);
      await writeFile(filePath, buffer);
      
      console.log('File saved locally:', filePath);
      
      return {
        url: `/uploads/${timestamp}-${fileName}`,
        id: `local-${timestamp}`,
        provider: 'local',
      };
    } catch (error: any) {
      console.error('Local storage failed:', error);
      // Пробуем резервные варианты
    }
  }

  if (isSupabaseConfigured()) {
    console.log('Attempting Supabase upload...');
    try {
      const url = await uploadToSupabase(buffer, fileName, mimeType);
      console.log('Supabase upload successful:', url);
      return {
        url,
        id: `supabase-${timestamp}`,
        provider: 'supabase',
      };
    } catch (error: any) {
      console.error('Supabase upload failed:', error);
      console.error('Error details:', error.message);
      // Пробуем следующий вариант
    }
  } else {
    console.log('Supabase not configured. Checking reasons...');
    if (!hasSupabaseUrl) console.log('  - NEXT_PUBLIC_SUPABASE_URL is missing');
    if (!hasSupabaseKey) console.log('  - SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  if (isCloudinaryConfigured()) {
    try {
      const url = await uploadToCloudinary(buffer, fileName, mimeType);
      return {
        url,
        id: `cloudinary-${timestamp}`,
        provider: 'cloudinary',
      };
    } catch (error: any) {
      console.error('Cloudinary upload failed:', error);
      // Пробуем следующий вариант
    }
  }


  // Детальное сообщение об ошибке
  const missingVars: string[] = [];
  const missingSupabase: string[] = [];
  const missingCloudinary: string[] = [];
  
  if (!hasSupabaseUrl) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    missingSupabase.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!hasSupabaseKey) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    missingSupabase.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!hasCloudinaryName) {
    missingVars.push('CLOUDINARY_CLOUD_NAME');
    missingCloudinary.push('CLOUDINARY_CLOUD_NAME');
  }
  if (!hasCloudinaryKey) {
    missingVars.push('CLOUDINARY_API_KEY');
    missingCloudinary.push('CLOUDINARY_API_KEY');
  }
  if (!hasCloudinarySecret) {
    missingVars.push('CLOUDINARY_API_SECRET');
    missingCloudinary.push('CLOUDINARY_API_SECRET');
  }

  // Если дошли сюда, значит ничего не работает
  // В production на Netlify это не должно произойти, так как локальное хранилище должно работать
  const errorMsg = `Ошибка сохранения фотографии. Попробуйте еще раз или обратитесь к администратору.`;

  console.error('=== Storage configuration error ===');
  console.error(errorMsg);
  
  throw new Error(errorMsg);
}

export function isStorageConfigured(): boolean {
  return isNetlifyConfigured() || isSupabaseConfigured() || isCloudinaryConfigured() || process.env.NODE_ENV === 'development';
}

