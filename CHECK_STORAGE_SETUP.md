# Проверка настройки хранилища

Если вы видите ошибку "Нет настроенного хранилища", выполните следующие шаги:

## Шаг 1: Проверьте переменные в Netlify

1. Откройте https://app.netlify.com
2. Выберите ваш сайт **astrinn**
3. Перейдите в **Site settings** → **Environment variables**
4. Проверьте, что добавлены следующие переменные:

### Для Supabase (рекомендуется):
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://ваш-проект-id.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = ваш service_role ключ

### Или для Cloudinary:
- ✅ `CLOUDINARY_CLOUD_NAME` = ваш cloud name
- ✅ `CLOUDINARY_API_KEY` = ваш API key
- ✅ `CLOUDINARY_API_SECRET` = ваш API secret

## Шаг 2: Убедитесь что переменные правильные

### Для Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` должен начинаться с `https://` и заканчиваться на `.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` должен быть длинным ключом (начинается с `eyJ...`)
- ⚠️ НЕ используйте anon ключ! Нужен именно service_role ключ

### Как получить service_role ключ:
1. Откройте ваш проект в Supabase Dashboard
2. Settings → API
3. Найдите раздел "Project API keys"
4. Найдите ключ "service_role" (НЕ "anon"!)
5. Нажмите "Reveal" чтобы показать
6. Скопируйте весь ключ

## Шаг 3: Пересоберите проект

После добавления/изменения переменных:
1. В Netlify: **Deploys** → **Trigger deploy** → **Deploy site**
2. Или сделайте commit + push в GitHub

## Шаг 4: Проверьте логи

Если ошибка все еще есть:
1. В Netlify: **Deploys** → выберите последний deploy
2. Откройте **Functions** → выберите функцию `/api/photos/upload`
3. Посмотрите логи - там будет указано, какие переменные отсутствуют

## Быстрая проверка

Откройте консоль браузера на сайте и попробуйте загрузить фотографию. В логах Netlify вы увидите:
```
Storage configuration check: {
  supabase: { url: true/false, key: true/false },
  cloudinary: { name: true/false, key: true/false, secret: true/false }
}
```

Это покажет, какие переменные настроены, а какие отсутствуют.

## Частые ошибки

1. **Используете anon ключ вместо service_role**
   - Решение: Используйте service_role ключ из Supabase Dashboard

2. **Переменные добавлены, но проект не пересобран**
   - Решение: Пересоберите проект после добавления переменных

3. **Неправильное имя переменной**
   - Проверьте точное написание: `NEXT_PUBLIC_SUPABASE_URL` (с `NEXT_PUBLIC_` в начале!)

4. **Переменная добавлена в неправильный scope**
   - Убедитесь, что выбран "All scopes" или "Production"

## Нужна помощь?

Если все настроено правильно, но ошибка остается:
1. Проверьте логи в Netlify Functions
2. Убедитесь, что bucket `astrinn-photos` создан в Supabase Storage
3. Проверьте, что bucket публичный (Public bucket = ON)

