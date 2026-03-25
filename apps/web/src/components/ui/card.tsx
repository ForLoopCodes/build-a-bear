import * as React from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(24,24,27,0.5)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return <h3 className={cn("text-sm font-semibold tracking-wide text-zinc-100", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return <p className={cn("mt-1 text-xs text-zinc-400", className)} {...props} />;
}
