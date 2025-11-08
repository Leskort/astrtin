'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // Важно: принимаем cookie от сервера
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Успешный вход - обновляем страницу, чтобы cookie точно установился
      console.log('Вход успешен, переход в галерею...');
      
      // Небольшая задержка для установки cookie
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Используем window.location для гарантированного обновления с новым cookie
      window.location.href = '/gallery';
    } catch (err: any) {
      setError(err.message || 'Неверный email или пароль');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 md:space-y-6">
      <div className="space-y-4">
        <Input
          type="email"
          label="EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          disabled={loading}
          autoComplete="email"
        />

        <Input
          type="password"
          label="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="p-3 md:p-4 border-2 border-[var(--matrix-red-neon)] bg-[var(--matrix-black)] bg-opacity-50">
          <p className="text-[var(--matrix-red-neon)] font-mono text-xs md:text-sm text-glow-red">
            {error}
          </p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'ВХОД...' : 'ВОЙТИ'}
      </Button>
    </form>
  );
}

