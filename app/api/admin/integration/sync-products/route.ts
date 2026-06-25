import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncProducts } from '@/lib/integrations/integration-service';

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
    const settings = await prisma.integrationSettings.findFirst();
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
