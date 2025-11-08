'use client';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ text = 'LOADING...', size = 'md' }: LoadingProps) {
  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-xs md:text-sm',
    lg: 'text-sm md:text-base',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
      <div className="relative">
        <div className="w-12 h-12 md:w-16 md:h-16 border-3 md:border-4 border-[var(--matrix-green-dark)] border-t-[var(--matrix-green-bright)] rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 md:w-16 md:h-16 border-3 md:border-4 border-transparent border-t-[var(--matrix-green-bright)] rounded-full animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      {text && (
        <p className={`font-mono text-[var(--matrix-green-bright)] text-glow text-center px-2 ${sizeStyles[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}

