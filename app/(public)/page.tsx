'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--matrix-black)] p-4">
      <div className="text-center space-y-8 fade-in">
        <h1 className="text-4xl md:text-6xl font-mono text-[var(--matrix-green-bright)] text-glow-strong mb-4">
          MATRIX PHOTO VAULT
        </h1>
        
        <p className="text-[var(--matrix-green-soft)] font-mono text-lg md:text-xl mb-8">
          PROCEED: SAY CODE WORD
        </p>

        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[var(--matrix-green-bright)] button-glow pulse flex items-center justify-center">
            <svg
              className="w-16 h-16 md:w-20 md:h-20 text-[var(--matrix-green-bright)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>

          <Button
            size="lg"
            className="mt-4"
            onClick={() => {
              // TODO: Implement voice recognition
              alert('Voice recognition will be implemented in the next step');
            }}
          >
            START RECORDING
          </Button>
        </div>

        <p className="text-[var(--matrix-green-dark)] font-mono text-sm mt-8">
          SECURE ACCESS REQUIRED
        </p>
      </div>
    </div>
  );
}

