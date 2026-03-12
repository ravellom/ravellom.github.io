import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getWorkspaceContext } from '@/lib/domain/workspace';
import { prisma } from '@/lib/prisma';
import { LikertWorkbench } from '@/components/likert/LikertWorkbench';
import { ModuleRibbon } from '@/components/layout/ModuleRibbon';

type Primitive = string | number | boolean | null;
type DataRow = Record<string, Primitive>;

export default async function LikertPage() {
  const user = await requireSession();
  const { workspace, membership } = await getWorkspaceContext(user.id, user.name);

  const activeDatasetId = membership?.activeDatasetId || null;
  if (!activeDatasetId) {
    return (
      <section className="container-wide">
        <ModuleRibbon
          title="Likert Charts"
          subtitle="Visualización de escalas Likert con navegación de workspace"
          tone="purple"
          right={<div className="dataset-pill">Dataset activo: <strong>No seleccionado</strong></div>}
        />
        <div className="card" style={{ marginTop: 16, maxWidth: 980 }}>
          <h1>Likert Charts</h1>
          <p>No hay dataset activo seleccionado.</p>
          <div className="row">
            <Link href="/datasets" className="btn">Seleccionar dataset activo</Link>
            <Link href="/dashboard" className="btn btn-secondary">Volver al dashboard</Link>
          </div>
        </div>
      </section>
    );
  }

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: activeDatasetId,
      workspaceId: workspace.id
    },
    select: {
      id: true,
      name: true,
      columns: true,
      data: true
    }
  });

  if (!dataset) {
    return (
      <section className="container-wide">
        <ModuleRibbon
          title="Likert Charts"
          subtitle="Visualización de escalas Likert con navegación de workspace"
          tone="purple"
          right={<div className="dataset-pill">Dataset activo: <strong>No disponible</strong></div>}
        />
        <div className="card" style={{ marginTop: 16, maxWidth: 980 }}>
          <h1>Likert Charts</h1>
          <p>El dataset activo ya no está disponible.</p>
          <div className="row">
            <Link href="/datasets" className="btn">Elegir otro dataset</Link>
            <Link href="/dashboard" className="btn btn-secondary">Volver al dashboard</Link>
          </div>
        </div>
      </section>
    );
  }

  const rows = (Array.isArray(dataset.data) ? dataset.data : []) as DataRow[];
  const columns = (Array.isArray(dataset.columns) ? dataset.columns : []) as string[];
  const datasets = await prisma.dataset.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      rowCount: true,
      columnCount: true
    }
  });

  return (
    <section className="container-wide">
      <ModuleRibbon
        title="Likert Charts"
        subtitle="Visualización de escalas Likert con navegación de workspace"
        tone="purple"
        right={<div className="dataset-pill">Dataset activo: <strong>{dataset.name}</strong></div>}
      />

      <div style={{ marginTop: 16 }}>
        <LikertWorkbench
          activeDatasetId={dataset.id}
          datasetName={dataset.name}
          rows={rows}
          columns={columns}
          datasets={datasets}
        />
      </div>
    </section>
  );
}
