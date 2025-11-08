'use client';

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--matrix-black)] p-4 md:p-6">
      <div className="w-full max-w-md text-center fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-mono text-[var(--matrix-green-bright)] text-glow-strong mb-3 md:mb-4">
          ВОЙТИ
        </h1>
        
        <p className="text-[var(--matrix-green-soft)] font-mono text-xs md:text-sm mb-6 md:mb-8">
          SECURE ACCESS REQUIRED
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
