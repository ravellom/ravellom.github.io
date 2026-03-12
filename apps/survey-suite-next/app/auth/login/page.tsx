import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ registered?: string }>;
}) {
  const params = (await searchParams) || {};
  const registered = params.registered === '1';

  return (
    <section className="container" style={{ marginTop: 24 }}>
      {registered ? (
        <p className="card" style={{ marginBottom: '12px', color: '#166534' }}>
          Registro completado. Inicia sesión con tu nueva cuenta.
        </p>
      ) : null}
      <AuthForm mode="login" />
      <p className="muted">¿No tienes cuenta? <Link href="/auth/register">Regístrate</Link></p>
    </section>
  );
}
