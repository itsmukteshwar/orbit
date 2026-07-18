import { cn } from "@/lib/utils";

interface OrbitLogoProps {
  /** Pixel size of the infinity mark. */
  size?: number;
  className?: string;
}

/** The Orbit infinity brand mark (SVG, brand-kit colours). */
export function OrbitLogo({ size = 30, className }: OrbitLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(className)}
    >
      <path
        d="M20 24c-6 0-11 5-11 11s5 11 11 11c10 0 14-22 24-22 6 0 11 5 11 11s-5 11-11 11c-5 0-8.5-4-12-9"
        fill="none"
        stroke="#2563EB"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="52" cy="16" r="5" fill="#60A5FA" />
    </svg>
  );
}
