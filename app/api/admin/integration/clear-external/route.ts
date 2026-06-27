import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function POST(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    await prisma.externalProduct.deleteMany({
      where: { storeId: store.id },
    });

    await prisma.integrationLog.create({
      data: {
        type: 'CLEAR_EXTERNAL_PRODUCTS',
        status: 'SUCCESS',
        message: `[${store.name}] Все товары внешней базы данных (ExternalProduct) были удалены администратором.`,
      },
    });

    return NextResponse.json({ success: true, message: 'Все внешние товары успешно очищены.' });
  } catch (error: any) {
    console.error('Error clearing external products:', error);
    return NextResponse.json({ error: 'Ошибка сервера при очистке внешних товаров' }, { status: 500 });
  }
}
