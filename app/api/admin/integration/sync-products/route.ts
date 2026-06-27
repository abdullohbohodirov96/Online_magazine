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
    const settings = await prisma.integrationSettings.findUnique({
      where: { storeId: store.id },
    });
    if (!settings) {
      return NextResponse.json({ error: 'Настройки интеграции не найдены' }, { status: 404 });
    }

    if (!settings.integrationApiUrl) {
      return NextResponse.json({ error: 'URL API не настроен' }, { status: 400 });
    }

    const result = await syncProducts(settings);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error in automatic api sync:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при синхронизации' }, { status: 500 });
  }
}
