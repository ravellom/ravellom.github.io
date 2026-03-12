import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreatePersonalWorkspace } from '@/lib/domain/workspace';
import { parseCsvText } from '@/lib/csv/parseCsv';

const createDatasetSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  csvText: z.string().min(10)
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const workspace = await getOrCreatePersonalWorkspace(session.user.id, session.user.name);

  const datasets = await prisma.dataset.findMany({
    where: {
      workspaceId: workspace.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      name: true,
      description: true,
      rowCount: true,
      columnCount: true,
      columns: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return NextResponse.json({ ok: true, workspace, datasets });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = createDatasetSchema.parse(body);

    const parsed = parseCsvText(payload.csvText);
    const workspace = await getOrCreatePersonalWorkspace(session.user.id, session.user.name);

    const dataset = await prisma.dataset.create({
      data: {
        workspaceId: workspace.id,
        createdById: session.user.id,
        name: payload.name,
        description: payload.description || null,
        format: 'csv',
        rowCount: parsed.rows.length,
        columnCount: parsed.headers.length,
        columns: parsed.headers,
        data: parsed.rows
      },
      select: {
        id: true,
        name: true,
        description: true,
        rowCount: true,
        columnCount: true,
        columns: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id
        }
      },
      select: {
        activeDatasetId: true
      }
    });

    if (membership && !membership.activeDatasetId) {
      await prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: session.user.id
          }
        },
        data: {
          activeDatasetId: dataset.id
        }
      });
    }

    return NextResponse.json({ ok: true, dataset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
