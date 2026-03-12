import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="suite-home container-wide">
      <div className="home-hero card">
        <h1>Survey Suite Next</h1>
        <p>
          Arquitectura unificada con autenticación, datasets en backend y módulos integrados.
        </p>
      </div>

      <div className="home-modules">
        <article className="card module-card">
          <h2>Data Processor</h2>
          <p>Importa CSV, gestiona datasets y define el dataset activo del workspace.</p>
          <Link href="/datasets" className="btn">Abrir módulo</Link>
        </article>

        <article className="card module-card">
          <h2>Likert Charts</h2>
          <p>Genera barras apiladas y divergentes sobre el dataset activo para análisis rápido.</p>
          <Link href="/likert" className="btn">Abrir módulo</Link>
        </article>

        <article className="card module-card">
          <h2>Distribution Lab</h2>
          <p>Módulo preparado para boxplot/raincloud y comparativas avanzadas de distribución.</p>
          <Link href="/distribution" className="btn">Abrir módulo</Link>
        </article>
      </div>
    </section>
  );
}
