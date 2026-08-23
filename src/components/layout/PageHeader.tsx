import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  id?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, id }) => {
  return (
    <div id={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
