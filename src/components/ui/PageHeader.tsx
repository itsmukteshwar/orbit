import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  /** Right-aligned actions (buttons, dropdowns). */
  actions?: React.ReactNode;
  /**
   * P-05 extension: structured breadcrumb trail rendered above the title.
   * When provided, prefer it over encoding the trail in `subtitle`.
   */
  breadcrumbs?: Crumb[];
}

/** Page title block with subtitle and action buttons. */
export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-0.5">
            <ol className="flex items-center gap-1 text-[13px]">
              {breadcrumbs.map((crumb, i) => {
                const last = i === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                    {crumb.href && !last ? (
                      <Link href={crumb.href} className="text-slate-400 hover:text-slate-600">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={last ? "font-medium text-slate-600" : "text-slate-400"}>{crumb.label}</span>
                    )}
                    {!last && <span className="text-slate-300">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="font-display text-xl font-semibold text-orbit-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
