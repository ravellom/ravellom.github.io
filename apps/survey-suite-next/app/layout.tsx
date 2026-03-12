import './globals.css';
import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: 'Survey Suite Next',
  description: 'Survey Suite with auth and backend-ready architecture'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <AppHeader />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
