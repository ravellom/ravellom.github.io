import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreatePersonalWorkspace } from '@/lib/domain/workspace';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing dataset id' }, { status: 400 });
  }

  const workspace = await getOrCreatePersonalWorkspace(session.user.id, session.user.name);

  const dataset = await prisma.dataset.findFirst({
    where: {
      id,
      workspaceId: workspace.id
    },
    select: {
      id: true,
      name: true,
      description: true,
      rowCount: true,
      columnCount: true,
      columns: true,
      data: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!dataset) {
    return NextResponse.json({ ok: false, error: 'Dataset not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, dataset });
}
