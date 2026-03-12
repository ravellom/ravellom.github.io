'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const registerResult = await registerResponse.json();
        if (!registerResponse.ok || !registerResult.ok) {
          throw new Error(registerResult.error || 'No se pudo registrar el usuario');
        }

        router.push('/auth/login?registered=1');
        router.refresh();
        return;
      }

      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (!loginResult || loginResult.error) {
        throw new Error('Credenciales inválidas');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card auth-form">
      <h1>{mode === 'register' ? 'Registro' : 'Iniciar sesión'}</h1>

      {mode === 'register' ? (
        <label>
          Nombre
          <input
            type="text"
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </label>
      ) : null}

      <label>
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
      </label>

      <label>
        Contraseña
        <input
          type="password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button type="submit" className="btn" disabled={loading}>
        {loading ? 'Procesando...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
      </button>
    </form>
  );
}
