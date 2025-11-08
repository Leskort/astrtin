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

      // Успешный вход
      console.log('Вход успешен, переход в галерею...');
      router.push('/gallery');
      // Fallback на случай если router не сработает
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          window.location.href = '/gallery';
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Неверный email или пароль');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
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
        <p className="text-[var(--matrix-red-neon)] font-mono text-sm text-glow-red">
          {error}
        </p>
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

