import { ReactNode } from 'react';

type ModuleRibbonProps = {
  title: string;
  subtitle: string;
  tone?: 'blue' | 'purple' | 'teal' | 'slate';
  right?: ReactNode;
};

export function ModuleRibbon({ title, subtitle, tone = 'slate', right }: ModuleRibbonProps) {
  return (
    <section className={`module-ribbon tone-${tone}`}>
      <div>
        <h2 className="module-ribbon-title">{title}</h2>
        <p className="module-ribbon-subtitle">{subtitle}</p>
      </div>
      {right ? <div className="module-ribbon-right">{right}</div> : null}
    </section>
  );
}
