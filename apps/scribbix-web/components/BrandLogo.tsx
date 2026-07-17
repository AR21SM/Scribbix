import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  href?: string;
}

export function BrandLogo({ className, href = "/" }: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Skribbix home"
      className={cn(
        "inline-flex items-center text-2xl font-bold tracking-tight text-[#0a1128] transition-opacity hover:opacity-90",
        className,
      )}
    >
      <span>Skribbi</span>
      <span className="relative inline-block">
        x
        <svg
          aria-hidden="true"
          className="absolute -top-[0.42em] -right-[0.56em] size-[0.56em] rotate-[15deg] text-[#ffbe5c]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        >
          <path d="M6 18 L3 12" />
          <path d="M12 16 L12 9" />
          <path d="M16 18 L20 14" />
        </svg>
      </span>
    </Link>
  );
}
