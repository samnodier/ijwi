import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  label?: string;
};

export function IssueIcon({ src, label, className = "", ...props }: Props) {
  return (
    <img
      src={src}
      alt={label ?? ""}
      aria-hidden={!label}
      className={`h-6 w-6 text-brand-700 ${className}`}
      {...props}
    />
  );
}
