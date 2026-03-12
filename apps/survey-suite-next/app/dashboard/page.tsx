import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext } from '@/lib/domain/workspace';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import { ModuleRibbon } from '@/components/layout/ModuleRibbon';

export default async function DashboardPage() {
  const user = await requireSession();
  const { workspace, membership } = await getWorkspaceContext(user.id, user.name);

  const datasetCount = await prisma.dataset.count({
    where: { workspaceId: workspace.id }
  });

  return (
    <section className="container-wide">
      <ModuleRibbon
        title="Dashboard"
        subtitle="Estado general del workspace y acceso rápido a módulos"
        tone="slate"
        right={<div className="dataset-pill">Dataset activo: <strong>{membership?.activeDataset?.name || 'No seleccionado'}</strong></div>}
      />

      <div className="card" style={{ marginTop: 16 }}>
        <h1>Dashboard</h1>
        <p>Sesión válida en backend (cookie segura en servidor).</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email || 'sin email'}</p>
        <p><strong>Nombre:</strong> {user.name || 'sin nombre'}</p>
        <p><strong>Workspace:</strong> {workspace.name}</p>
        <p><strong>Datasets:</strong> {datasetCount}</p>
        <p>
          <strong>Dataset activo:</strong>{' '}
          {membership?.activeDataset ? membership.activeDataset.name : 'No seleccionado'}
        </p>
        <div className="row">
          <Link href="/datasets" className="btn">Data Processor</Link>
          <Link href="/likert" className="btn btn-secondary">Likert Charts</Link>
          <Link href="/distribution" className="btn btn-secondary">Distribution Lab</Link>
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
