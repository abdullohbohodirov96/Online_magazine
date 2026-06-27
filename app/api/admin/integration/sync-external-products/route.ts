import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncProducts } from '@/lib/integrations/integration-service';
import { verifyAdminAccess } from '@/lib/store/security';

export async function POST(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const productsArray = await request.json();

    if (!Array.isArray(productsArray)) {
      return NextResponse.json({ error: 'Неверный формат данных, ожидается массив' }, { status: 400 });
    }

    const settings = await prisma.integrationSettings.findUnique({
      where: { storeId: store.id },
    });
    if (!settings) {
      return NextResponse.json({ error: 'Настройки интеграции не найдены' }, { status: 404 });
    }

    const result = await syncProducts(settings, productsArray);

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('Error in manual json sync:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при синхронизации' }, { status: 500 });
  }
}
