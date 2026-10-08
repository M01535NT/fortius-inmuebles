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
    <span role="img" aria-label="Fortius Inmuebles" className={cn('brand-mark inline-flex shrink-0 items-center', variant === 'symbol' ? 'h-8 w-8' : 'h-10 w-40', inverse && 'brand-mark-on-image', className)}>
      <svg aria-hidden="true" focusable="false" viewBox={viewBox} className="h-full w-full">
        {fortiusPaths.symbol.map((d, i) => <path key={d} d={d} fill={i < 2 ? '#061f3f' : '#8a1634'} />)}
        {variant !== 'symbol' && fortiusPaths.wordmark.map(d => <path key={d} d={d} fill="#061f3f" />)}
        {variant === 'full' && fortiusPaths.descriptor.map((glyph, i) => <path key={i} {...glyph} fill="#061f3f" />)}
      </svg>
    </span>
  );
}
