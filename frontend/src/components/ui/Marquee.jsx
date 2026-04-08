import React from 'react';

/**
 * Pure React Marquee – no Next.js / shadcn dependency.
 * Adapted from the cnippet template for Vite + React + Tailwind 3.
 */
export function Marquee({
  children,
  className = '',
  pauseOnHover = false,
  vertical = false,
  reverse = false,
}) {
  return (
    <div
      className={`group flex overflow-hidden [--duration:40s] [--gap:1rem] ${className}`}
      style={{
        flexDirection: vertical ? 'column' : 'row',
      }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`flex shrink-0 gap-[var(--gap)] ${
            vertical
              ? 'flex-col animate-marquee-vertical'
              : 'flex-row animate-marquee'
          } ${reverse ? '[animation-direction:reverse]' : ''} ${
            pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
          }`}
          aria-hidden={i === 1}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
