import React from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/** One per section, above the headline. Mono, uppercase, letterspaced, muted. */
export function Eyebrow({ children, className = '', as: Tag = 'p' }: EyebrowProps) {
  return (
    <Tag className={`font-mono uppercase text-[12px] leading-none tracking-[0.12em] text-fg-3 ${className}`.trim()}>
      {children}
    </Tag>
  );
}
