import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getWorkspaceContext } from '@/lib/domain/workspace';
import { ModuleRibbon } from '@/components/layout/ModuleRibbon';

export default async function DistributionPage() {
  const user = await requireSession();
  const { membership } = await getWorkspaceContext(user.id, user.name);

  const activeName = membership?.activeDataset?.name || 'No seleccionado';

  return (
    <section className="container-wide">
      <ModuleRibbon
        title="Distribution Lab"
        subtitle="Boxplot, violín y raincloud para variables numéricas"
        tone="teal"
        right={<div className="dataset-pill">Dataset activo: <strong>{activeName}</strong></div>}
      />

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Módulo en construcción</h3>
        <p>Este módulo quedará integrado con la misma navegación y panel lateral que Likert.</p>
        <div className="row">
          <Link href="/datasets" className="btn">Ir a datasets</Link>
          <Link href="/likert" className="btn btn-secondary">Ir a Likert</Link>
        </div>
      </div>
    </section>
  );
}
