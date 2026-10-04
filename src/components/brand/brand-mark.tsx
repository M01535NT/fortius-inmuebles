import Image from 'next/image';

type BrandMarkProps = {
  variant?: 'full' | 'compact' | 'symbol';
  inverse?: boolean;
  className?: string;
};

/** Shared Mint identity for the public site and administration. */
export function BrandMark({ variant = 'full', inverse = false, className = '' }: BrandMarkProps) {
  return (
    <span
      role="img"
      aria-label="Mint Inmuebles"
      className={`inline-flex items-center gap-2 ${variant === 'symbol' ? 'h-8 w-8' : 'h-10 w-[137.5px]'} shrink-0 ${inverse ? 'text-white' : 'text-brand-ink'} ${className}`}
    >
      <Image src="/brand/mint-leaf.png" alt="" width={64} height={64} unoptimized className={`${variant === 'symbol' ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 object-contain`} />
      {variant !== 'symbol' && (
        <span aria-hidden="true" className="flex flex-col">
          <span className="text-[30px] font-semibold leading-none tracking-[-0.045em]">Mint</span>
          {variant === 'full' && <span className="mt-0.5 text-[11px] leading-none tracking-[0.02em]">Inmuebles</span>}
        </span>
      )}
    </span>
  );
}
