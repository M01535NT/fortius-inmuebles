"use client";
import { Separator as S } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/panel/utils";

export function Separator({ className, orientation = "horizontal", decorative = true, ...props }: ComponentProps<typeof S.Root>) {
  return <S.Root decorative={decorative} orientation={orientation} className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)} {...props} />;
}
