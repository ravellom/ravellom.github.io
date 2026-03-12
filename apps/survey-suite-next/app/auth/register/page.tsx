import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function RegisterPage() {
  return (
    <section className="container" style={{ marginTop: 24 }}>
      <AuthForm mode="register" />
      <p className="muted">¿Ya tienes cuenta? <Link href="/auth/login">Inicia sesión</Link></p>
    </section>
  );
}
