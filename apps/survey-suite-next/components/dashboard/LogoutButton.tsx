'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <button className="btn btn-secondary" onClick={onLogout}>
      Cerrar sesión
    </button>
  );
}
