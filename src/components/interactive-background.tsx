
'use client';
import { cn } from '@/lib/utils';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import React from 'react';

export function InteractiveBackground({ active = true }: { active?: boolean }) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const backgroundStyle = useMotionTemplate`
    radial-gradient(
      650px circle at ${mouseX}px ${mouseY}px,
      rgba(3, 105, 161, 0.4),
      transparent 80%
    )
  `;

  return (
    <div
      className={cn(
        'pointer-events-none absolute -inset-px transition-opacity duration-1000',
        active ? 'opacity-100' : 'opacity-0'
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: backgroundStyle }}
      />
    </div>
  );
}
