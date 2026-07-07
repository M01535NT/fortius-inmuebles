import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <BlurFade className={cn("grid gap-5 md:grid-cols-[0.9fr_0.72fr] md:items-end", className)}>
      <div>
        <h2 className="display-title max-w-[11ch] text-5xl text-foreground md:text-7xl">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </BlurFade>
  );
}
