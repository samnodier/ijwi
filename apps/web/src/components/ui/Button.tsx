import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  primary: "bg-accent-600 text-white hover:bg-accent-500 shadow-sm",
  secondary: "bg-brand-800 text-white hover:bg-brand-700 shadow-sm",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-100",
  outline: "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50",
};

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
