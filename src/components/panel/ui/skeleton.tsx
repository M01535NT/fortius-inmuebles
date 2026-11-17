import type { ComponentProps } from "react";

import { cn } from "@/lib/panel/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-[var(--r-md)] bg-muted motion-reduce:animate-none", className)} {...props} />;
}
