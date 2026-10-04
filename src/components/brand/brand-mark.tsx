import { cn } from '@/lib/utils';
import { fortiusPaths } from './brand-paths';

type BrandMarkProps = {
  variant?: 'full' | 'compact' | 'symbol';
  inverse?: boolean;
  className?: string;
};

/** Architectural Fortius identity shared by the public site and administration. */
export function BrandMark({ variant = 'full', inverse = false, className }: BrandMarkProps) {
  const viewBox = variant === 'symbol' ? '174 -4 228 250' : variant === 'compact' ? '-4 -4 1275 250' : '-4 -4 1275 324';
  return (
    <span role="img" aria-label="Fortius Inmuebles" className={cn('inline-flex shrink-0 items-center', variant === 'symbol' ? 'h-8 w-8' : 'h-10 w-40', inverse ? 'text-white [--logo-accent:#e5829b]' : 'text-brand-ink', className)}>
      <svg aria-hidden="true" focusable="false" viewBox={viewBox} className="h-full w-full">
        {fortiusPaths.symbol.map((d, i) => <path key={d} d={d} fill={i < 2 ? 'currentColor' : 'var(--logo-accent)'} />)}
        {variant !== 'symbol' && fortiusPaths.wordmark.map(d => <path key={d} d={d} fill="currentColor" />)}
        {variant === 'full' && fortiusPaths.descriptor.map((glyph, i) => <path key={i} {...glyph} fill="currentColor" />)}
      </svg>
    </span>
  );
}
