# Настройка Bucket в Supabase Storage

Если вы видите ошибку при загрузке фотографий, убедитесь, что bucket создан в Supabase Storage.

## Шаг 1: Откройте Supabase Dashboard

1. Откройте https://supabase.com/dashboard/project/wgjlkptioiipijbsxvvu
2. В левом меню выберите **Storage**

## Шаг 2: Создайте Bucket

1. Нажмите **New bucket**
2. Введите имя: `astrinn-photos`
3. **ВАЖНО**: Включите опцию **Public bucket** (публичный bucket)
4. Нажмите **Create bucket**

## Шаг 3: Проверьте настройки Bucket

1. Откройте созданный bucket `astrinn-photos`
2. Убедитесь, что:
   - ✅ **Public bucket** = ON (включено)
   - ✅ Bucket активен

## Шаг 4: Проверьте переменные окружения в Netlify

Убедитесь, что в Netlify добавлены:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://wgjlkptioiipijbsxvvu.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = ваш service_role ключ (НЕ anon!)

## Шаг 5: Пересоберите проект

После создания bucket и проверки переменных:
1. В Netlify: **Deploys** → **Trigger deploy** → **Deploy site**
2. Дождитесь завершения сборки

## Проверка

После пересборки попробуйте загрузить фотографию. Если ошибка остается:
1. Откройте логи в Netlify: **Deploys** → последний deploy → **Functions** → `/api/photos/upload`
2. В логах будет видно точную причину ошибки

