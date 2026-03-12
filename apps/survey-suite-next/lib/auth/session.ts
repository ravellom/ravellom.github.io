import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name
  };
}
