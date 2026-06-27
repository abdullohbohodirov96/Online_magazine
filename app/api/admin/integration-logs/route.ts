import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
  const { authorized } = await verifyAdminAccess(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const logs = await prisma.integrationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching integration logs:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
