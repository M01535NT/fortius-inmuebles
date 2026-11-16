"use client";
import { Switch as S } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/panel/utils";

/** Interruptor. El área táctil mide 44 px aunque el riel mida 24 (pseudo-elemento). */
export function Switch({ className, ...props }: ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        "peer relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted transition-[color,background-color,border-color] duration-150",
        "before:absolute before:-inset-2.5 data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <S.Thumb className="pointer-events-none block size-4 translate-x-1 rounded-full bg-[var(--raised)] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=checked]:translate-x-5 motion-reduce:transition-none" />
    </S.Root>
  );
}
