'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimateIn({ children, className, style }: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        'opacity-0 transition-opacity duration-500',
        isIntersecting && 'animate-fade-in-up',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
