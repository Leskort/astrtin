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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabaseUrl = !!supabaseUrl;
  const hasSupabaseKey = !!supabaseKey;
  const hasCloudinaryName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasCloudinaryKey = !!process.env.CLOUDINARY_API_KEY;
  const hasCloudinarySecret = !!process.env.CLOUDINARY_API_SECRET;
  
  console.log('=== Storage configuration check ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Supabase URL:', hasSupabaseUrl ? `${supabaseUrl?.substring(0, 30)}...` : 'NOT SET');
  console.log('Supabase Key:', hasSupabaseKey ? `${supabaseKey?.substring(0, 20)}...` : 'NOT SET');
  console.log('Cloudinary Name:', hasCloudinaryName ? 'SET' : 'NOT SET');
  console.log('Cloudinary Key:', hasCloudinaryKey ? 'SET' : 'NOT SET');
  console.log('Cloudinary Secret:', hasCloudinarySecret ? 'SET' : 'NOT SET');
  console.log('isSupabaseConfigured():', isSupabaseConfigured());
  console.log('isCloudinaryConfigured():', isCloudinaryConfigured());
  
  // Приоритет: Supabase > Cloudinary > локальное хранилище
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

  // Формируем сообщение только о недостающих переменных для выбранного провайдера
  let errorMsg = 'Нет настроенного хранилища.\n\n';
  
  if (missingSupabase.length > 0 && missingCloudinary.length === 3) {
    // Если отсутствуют только Supabase переменные, показываем только их
    errorMsg += `Для Supabase (рекомендуется) отсутствуют:\n`;
    missingSupabase.forEach(v => errorMsg += `- ${v}\n`);
    errorMsg += `\nВАЖНО: После добавления переменных пересоберите проект в Netlify!\n`;
    errorMsg += `Deploys → Trigger deploy → Deploy site\n`;
  } else if (missingCloudinary.length > 0 && missingSupabase.length === 2) {
    // Если отсутствуют только Cloudinary переменные
    errorMsg += `Для Cloudinary отсутствуют:\n`;
    missingCloudinary.forEach(v => errorMsg += `- ${v}\n`);
  } else {
    // Если отсутствуют переменные обоих провайдеров
    errorMsg += `Добавьте переменные для одного из провайдеров:\n\n`;
    errorMsg += `Для Supabase (рекомендуется):\n`;
    errorMsg += `- NEXT_PUBLIC_SUPABASE_URL\n`;
    errorMsg += `- SUPABASE_SERVICE_ROLE_KEY\n\n`;
    errorMsg += `Или для Cloudinary:\n`;
    errorMsg += `- CLOUDINARY_CLOUD_NAME\n`;
    errorMsg += `- CLOUDINARY_API_KEY\n`;
    errorMsg += `- CLOUDINARY_API_SECRET\n`;
  }
  
  errorMsg += `\nОтсутствуют: ${missingVars.join(', ')}\n`;
  errorMsg += `\nВАЖНО: После добавления переменных в Netlify:\n`;
  errorMsg += `1. Перейдите в Deploys → Trigger deploy → Deploy site\n`;
  errorMsg += `2. Или сделайте commit + push в GitHub\n`;
  errorMsg += `3. Дождитесь завершения сборки\n\n`;
  errorMsg += `Инструкция: SUPABASE_SETUP.md`;

  console.error('=== Storage configuration error ===');
  console.error(errorMsg);
  
  throw new Error(errorMsg);
}

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured() || isCloudinaryConfigured() || process.env.NODE_ENV === 'development';
}

