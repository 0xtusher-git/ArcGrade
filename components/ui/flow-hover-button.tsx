'use client';

import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Dark-only "flow hover" button. The ::before circle starts outside the
 * bottom-right corner and floods the surface on hover/focus.
 */
const BASE_CLASSES = [
  'relative isolate z-0 inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-md',
  'border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-sm font-semibold text-zinc-200',
  'transition-all duration-500 sm:px-4',
  'before:absolute before:inset-0 before:-z-10 before:scale-[2.5] before:rounded-[100%] before:bg-zinc-200',
  'before:transition-transform before:duration-1000 before:content-[""]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
  'motion-reduce:!scale-100 motion-reduce:!transition-none motion-reduce:before:!transition-none',
].join(' ');

const INTERACTIVE_CLASSES = [
  'cursor-pointer before:translate-x-[150%] before:translate-y-[150%]',
  '[@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:text-zinc-900',
  '[@media(hover:hover)]:hover:before:translate-x-0 [@media(hover:hover)]:hover:before:translate-y-0',
  'focus-visible:scale-105 focus-visible:text-zinc-900',
  'focus-visible:before:translate-x-0 focus-visible:before:translate-y-0',
  'active:scale-95',
].join(' ');

const STATIC_CLASSES = [
  'cursor-not-allowed opacity-60',
  'before:translate-x-[150%] before:translate-y-[150%]',
].join(' ');

// Matches the existing in-card `.app-btn` geometry.
const FULL_WIDTH_CLASSES = 'w-full min-h-[52px] rounded-[1rem] px-6 py-3 font-bold leading-[1.5] sm:px-6';

export type FlowHoverButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  fullWidth?: boolean;
  hideLabelOnMobile?: boolean;
  loading?: boolean;
};

function IconSlot({ icon, loading }: { icon?: ReactNode; loading: boolean }) {
  if (loading) {
    return <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" />;
  }

  if (!icon) return null;

  return (
    <span className="inline-flex shrink-0" aria-hidden="true">
      {icon}
    </span>
  );
}

export function FlowHoverButton({
  className,
  icon,
  children,
  type = 'button',
  fullWidth = false,
  hideLabelOnMobile = false,
  loading = false,
  disabled,
  ...props
}: FlowHoverButtonProps) {
  const inactive = disabled || loading;

  return (
    <button
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={cn(
        BASE_CLASSES,
        inactive ? STATIC_CLASSES : INTERACTIVE_CLASSES,
        fullWidth && FULL_WIDTH_CLASSES,
        className
      )}
      {...props}
    >
      <IconSlot icon={icon} loading={loading} />
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>{children}</span>
    </button>
  );
}

// Keep the reference component's exported name available as well.
export { FlowHoverButton as Button };
