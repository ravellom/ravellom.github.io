import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext } from '@/lib/domain/workspace';

const bodySchema = z.object({
  datasetId: z.string().cuid().nullable()
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { workspace, membership } = await getWorkspaceContext(session.user.id, session.user.name);

  const datasets = await prisma.dataset.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      rowCount: true,
      columnCount: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    ok: true,
    workspace: {
      id: workspace.id,
      name: workspace.name
    },
    activeDataset: membership?.activeDataset || null,
    datasets
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = bodySchema.parse(await request.json());
    const { workspace } = await getWorkspaceContext(session.user.id, session.user.name);

    if (payload.datasetId) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: payload.datasetId,
          workspaceId: workspace.id
        }
      });

      if (!dataset) {
        return NextResponse.json({ ok: false, error: 'Dataset not found in workspace' }, { status: 404 });
      }
    }

    const membership = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id
        }
      },
      data: {
        activeDatasetId: payload.datasetId
      },
      include: {
        activeDataset: {
          select: {
            id: true,
            name: true,
            rowCount: true,
            columnCount: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json({ ok: true, activeDataset: membership.activeDataset || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
