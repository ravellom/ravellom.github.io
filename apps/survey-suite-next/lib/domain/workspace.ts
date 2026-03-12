import { prisma } from '@/lib/prisma';

export async function getOrCreatePersonalWorkspace(userId: string, userName?: string | null) {
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      role: 'OWNER'
    },
    include: {
      workspace: true
    }
  });

  if (existingMembership?.workspace) {
    return existingMembership.workspace;
  }

  const workspaceName = userName && userName.trim().length > 0
    ? `Workspace de ${userName}`
    : 'Mi Workspace';

  return prisma.workspace.create({
    data: {
      name: workspaceName,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'OWNER'
        }
      }
    }
  });
}

export async function getWorkspaceContext(userId: string, userName?: string | null) {
  const workspace = await getOrCreatePersonalWorkspace(userId, userName);

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId
      }
    },
    include: {
      activeDataset: {
        select: {
          id: true,
          name: true,
          rowCount: true,
          columnCount: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  return { workspace, membership };
}
