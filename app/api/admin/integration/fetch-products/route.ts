import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchExternalProducts } from '@/lib/integrations/integration-service';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
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
      return NextResponse.json({ error: 'API URL не настроен' }, { status: 400 });
    }

    const rawProducts = await fetchExternalProducts(settings as any);
    return NextResponse.json({ success: true, products: rawProducts });
  } catch (error: any) {
    console.error('Error fetching raw products:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при получении товаров' }, { status: 500 });
  }
}
