import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().trim().min(2).max(80).optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash
      },
      select: { id: true, email: true, name: true }
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
