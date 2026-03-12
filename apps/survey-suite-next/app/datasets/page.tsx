import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext } from '@/lib/domain/workspace';
import { DatasetsManager } from '@/components/datasets/DatasetsManager';
import { ModuleRibbon } from '@/components/layout/ModuleRibbon';

export default async function DatasetsPage() {
  const user = await requireSession();
  const { workspace, membership } = await getWorkspaceContext(user.id, user.name);

  const datasets = await prisma.dataset.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      rowCount: true,
      columnCount: true,
      columns: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const safeDatasets = datasets.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    columns: Array.isArray(d.columns) ? (d.columns as string[]) : null
  }));

  return (
    <section className="container-wide">
      <ModuleRibbon
        title="Data Processor"
        subtitle="Importación y gestión de datasets para toda la suite"
        tone="blue"
        right={<div className="dataset-pill">Dataset activo: <strong>{membership?.activeDataset?.name || 'No seleccionado'}</strong></div>}
      />

      <div style={{ marginTop: 16 }}>
        <DatasetsManager
          workspaceName={workspace.name}
          activeDatasetId={membership?.activeDatasetId || null}
          initialDatasets={safeDatasets}
        />
      </div>
    </section>
  );
}
