interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  /** Right-aligned actions (buttons, dropdowns). */
  actions?: React.ReactNode;
}

/** Page title block with subtitle and action buttons. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-semibold text-orbit-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
