'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/datasets', label: 'Data Processor' },
  { href: '/likert', label: 'Likert Charts' },
  { href: '/distribution', label: 'Distribution Lab' },
  { href: '/dashboard', label: 'Dashboard' }
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header-row">
        <div className="app-header-brand">
          <div className="topbar-brand">Survey Suite</div>
          <span className="topbar-badge">NEXT</span>
        </div>
        <div className="app-header-actions">
          <Link href="/auth/login" className="topbar-ghost-link">Login</Link>
          <Link href="/auth/register" className="topbar-ghost-link">Registro</Link>
        </div>
      </div>

      <div className="app-header-subtitle">Flujo integrado para procesar encuestas y generar visualizaciones.</div>

      <nav className="topbar-nav">
        {LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={`topbar-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
