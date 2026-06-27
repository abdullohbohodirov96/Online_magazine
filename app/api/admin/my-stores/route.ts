import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    let stores = [];

    if (user.role === 'SUPER_ADMIN') {
      stores = await prisma.store.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } else {
      // Find stores linked to this user
      const storeUsers = await prisma.storeUser.findMany({
        where: { userId: user.id },
        include: {
          store: true,
        },
      });
      stores = storeUsers.map((su) => su.store).filter((s) => s.isActive);
    }

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching my stores:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
