import * as React from "react";
import { cn } from "../../lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "danger";
};

export function Button({ className, variant = "default", ...props }: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" && "bg-zinc-900 text-zinc-50 hover:bg-zinc-700",
        variant === "ghost" && "bg-transparent text-zinc-100 hover:bg-zinc-800",
        variant === "outline" && "border border-zinc-700 text-zinc-100 hover:bg-zinc-800",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-600",
        className,
      )}
      {...props}
    />
  );
}
