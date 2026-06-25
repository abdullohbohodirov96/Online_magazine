import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await checkAdmin())) {
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
