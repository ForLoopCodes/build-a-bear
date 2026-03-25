import * as React from "react";
import { cn } from "../../lib/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100",
        "placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
