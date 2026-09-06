import { brandPaths } from './brand-paths';

type BrandMarkProps = {
  variant?: 'full' | 'compact' | 'symbol';
  inverse?: boolean;
  className?: string;
};

/** Shared outlined artwork. Commercial settings never override the identity. */
export function BrandMark({ variant = 'full', inverse = false, className = '' }: BrandMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${variant === 'symbol' ? 64 : 220} 64`}
      role="img"
      aria-label="MNT Inmuebles"
      className={`${variant === 'symbol' ? 'h-8 w-8' : 'h-10 w-[137.5px]'} shrink-0 ${className}`}
    >
      <path d={brandPaths.symbol} className={inverse ? 'fill-[#3FD8A0]' : 'fill-[#0F6B4E] dark:fill-[#3FD8A0]'} />
      {variant !== 'symbol' && (
        <g transform={`translate(88 ${variant === 'full' ? 0 : 14})`} className={inverse ? 'fill-white' : 'fill-foreground'}>
          <path d={brandPaths.initials} />
          {variant === 'full' && <g transform="translate(0 47)" fillRule="evenodd">
            {brandPaths.descriptor.map((glyph, index) => <path key={index} transform={`translate(${glyph.x} 0)`} d={glyph.d} />)}
          </g>}
        </g>
      )}
    </svg>
  );
}
