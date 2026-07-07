import * as React from "react";

import { cn } from "@/lib/utils";

type MarqueeProps = React.ComponentProps<"div"> & {
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
  duration?: string;
};

export function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  duration = "32s",
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      style={
        {
          "--duration": duration,
          "--gap": "1rem",
        } as React.CSSProperties
      }
      className={cn(
        "flex overflow-hidden [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        pauseOnHover && "marquee-pause",
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex shrink-0 items-center justify-around [gap:var(--gap)]",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
