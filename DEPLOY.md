# Инструкция по деплою на Netlify

## Шаг 1: Создание репозитория на GitHub

1. Перейдите на [GitHub](https://github.com) и войдите в свой аккаунт
2. Нажмите кнопку **"New repository"** (или перейдите по ссылке https://github.com/new)
3. Заполните форму:
   - **Repository name**: `photo-matrix-app` (или любое другое имя)
   - **Description**: "Secure photo storage with Matrix-style interface"
   - Выберите **Public** или **Private**
   - **НЕ** ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license" (все уже есть)
4. Нажмите **"Create repository"**

## Шаг 2: Подключение локального репозитория к GitHub

После создания репозитория GitHub покажет инструкции. Выполните команды:

```bash
cd /home/bes/hi/photo-matrix-app

# Добавьте remote репозиторий (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/photo-matrix-app.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/photo-matrix-app.git

# Отправьте код на GitHub
git branch -M main
git push -u origin main
```

## Шаг 3: Настройка Netlify

1. Перейдите на [Netlify](https://www.netlify.com) и войдите (можно через GitHub)
2. Нажмите **"Add new site"** → **"Import an existing project"**
3. Выберите **"Deploy with GitHub"** и авторизуйтесь
4. Выберите репозиторий `photo-matrix-app`
5. Настройте деплой:
   - **Build command**: `npm run build` (должно быть автоматически)
   - **Publish directory**: `.next` (должно быть автоматически)
   - Нажмите **"Deploy site"**

## Шаг 4: Настройка переменных окружения в Netlify

После первого деплоя (может быть ошибка из-за отсутствия переменных):

1. В панели Netlify перейдите в **Site settings** → **Environment variables**
2. Добавьте следующие переменные:

```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-site-name.netlify.app
VOICE_CODE=tron
VOICE_LANGUAGE=en-US
DATABASE_URL=your-database-url
STORAGE_PROVIDER=cloudinary
STORAGE_API_KEY=your-api-key
STORAGE_API_SECRET=your-api-secret
STORAGE_BUCKET=your-bucket-name
```

**Важно**: 
- `NEXTAUTH_SECRET` - сгенерируйте с помощью: `openssl rand -base64 32`
- `NEXTAUTH_URL` - замените на URL вашего сайта на Netlify
- Заполните остальные переменные в соответствии с вашим провайдером хранилища

3. После добавления переменных, перейдите в **Deploys** и нажмите **"Trigger deploy"** → **"Clear cache and deploy site"**

## Шаг 5: Проверка деплоя

После успешного деплоя:
- Откройте ваш сайт на Netlify
- Проверьте, что начальная страница отображается корректно
- Проверьте консоль браузера на наличие ошибок

## Полезные ссылки

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/overview/)

## Troubleshooting

### Ошибка при билде
- Убедитесь, что все переменные окружения добавлены
- Проверьте логи билда в Netlify Dashboard → Deploys → выберите деплой → View build log

### Ошибка 404 на страницах
- Убедитесь, что используется Next.js плагин для Netlify (должен быть автоматически)
- Проверьте файл `netlify.toml`

### Проблемы с переменными окружения
- Убедитесь, что `NEXTAUTH_URL` соответствует URL вашего сайта
- Проверьте, что все переменные добавлены без лишних пробелов

