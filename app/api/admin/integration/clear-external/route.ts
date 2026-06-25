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

export async function POST() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    await prisma.externalProduct.deleteMany();

    await prisma.integrationLog.create({
      data: {
        type: 'CLEAR_EXTERNAL_PRODUCTS',
        status: 'SUCCESS',
        message: 'Все товары внешней базы данных (ExternalProduct) были удалены администратором.',
      },
    });

    return NextResponse.json({ success: true, message: 'Все внешние товары успешно очищены.' });
  } catch (error: any) {
    console.error('Error clearing external products:', error);
    return NextResponse.json({ error: 'Ошибка сервера при очистке внешних товаров' }, { status: 500 });
  }
}
