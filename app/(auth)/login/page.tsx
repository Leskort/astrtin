'use client';

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--matrix-black)] p-4">
      <div className="w-full max-w-md text-center fade-in">
        <h1 className="text-4xl md:text-6xl font-mono text-[var(--matrix-green-bright)] text-glow-strong mb-4">
          ВОЙТИ
        </h1>
        
        <p className="text-[var(--matrix-green-soft)] font-mono text-sm mb-8">
          SECURE ACCESS REQUIRED
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
