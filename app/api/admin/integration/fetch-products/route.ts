import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchExternalProducts } from '@/lib/integrations/integration-service';

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
    const settings = await prisma.integrationSettings.findFirst();
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
