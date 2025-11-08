// Простое хранилище для небольшого количества фотографий (до 200 штук)
// Использует различные варианты в зависимости от доступности

import { uploadToSupabase, isSupabaseConfigured } from './supabase';
import { uploadToCloudinary, isCloudinaryConfigured } from './cloudinary';

export interface StorageResult {
  url: string;
  id: string;
  provider: 'supabase' | 'cloudinary' | 'local';
}

export async function uploadPhoto(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
  const timestamp = Date.now();
  
  // Диагностика: проверяем какие переменные есть
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasCloudinaryName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasCloudinaryKey = !!process.env.CLOUDINARY_API_KEY;
  const hasCloudinarySecret = !!process.env.CLOUDINARY_API_SECRET;
  
  console.log('Storage configuration check:', {
    supabase: { url: hasSupabaseUrl, key: hasSupabaseKey },
    cloudinary: { name: hasCloudinaryName, key: hasCloudinaryKey, secret: hasCloudinarySecret },
    nodeEnv: process.env.NODE_ENV,
  });
  
  // Приоритет: Supabase > Cloudinary > локальное хранилище
  if (isSupabaseConfigured()) {
    try {
      const url = await uploadToSupabase(buffer, fileName, mimeType);
      return {
        url,
        id: `supabase-${timestamp}`,
        provider: 'supabase',
      };
    } catch (error: any) {
      console.error('Supabase upload failed:', error);
      // Пробуем следующий вариант
    }
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

  // Если ничего не настроено, используем локальное хранилище (только development)
  if (process.env.NODE_ENV === 'development') {
    const { writeFile } = await import('fs/promises');
    const { join } = await import('path');
    const fs = await import('fs');
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = join(uploadsDir, `${timestamp}-${fileName}`);
    await writeFile(filePath, buffer);
    
    return {
      url: `/uploads/${timestamp}-${fileName}`,
      id: `local-${timestamp}`,
      provider: 'local',
    };
  }

  // Детальное сообщение об ошибке
  const missingVars: string[] = [];
  if (!hasSupabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!hasSupabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!hasCloudinaryName) missingVars.push('CLOUDINARY_CLOUD_NAME');
  if (!hasCloudinaryKey) missingVars.push('CLOUDINARY_API_KEY');
  if (!hasCloudinarySecret) missingVars.push('CLOUDINARY_API_SECRET');

  const errorMsg = `Нет настроенного хранилища. Добавьте в Netlify Environment Variables:
  
Для Supabase (рекомендуется):
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Или для Cloudinary:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Отсутствуют: ${missingVars.join(', ')}
Инструкция: SUPABASE_SETUP.md`;

  throw new Error(errorMsg);
}

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured() || isCloudinaryConfigured() || process.env.NODE_ENV === 'development';
}

