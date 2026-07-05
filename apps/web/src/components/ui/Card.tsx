import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg";
};

const paddingMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ padding = "md", className = "", children, ...props }: Props) {
  return (
    <div
      className={`rounded-xl border border-brand-100 bg-white shadow-sm ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
