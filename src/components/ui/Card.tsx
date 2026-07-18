import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** White surface card with the Orbit soft shadow. */
export function Card({ children, className }: CardProps) {
  return <section className={cn("rounded-xl bg-white shadow-card", className)}>{children}</section>;
}

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

/** Standard card header row: title (+ optional subtitle) with an optional right-side action. */
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 p-5 pb-3">
      <div>
        <h2 className="font-display font-semibold text-orbit-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
