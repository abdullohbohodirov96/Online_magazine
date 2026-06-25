import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncProducts } from '@/lib/integrations/integration-service';

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-integration-key');
    const secretKey = process.env.INTEGRATION_SECRET_KEY;

    if (!secretKey || key !== secretKey) {
      return NextResponse.json({ error: 'Доступ запрещен: невалидный x-integration-key' }, { status: 403 });
    }

    const productsArray = await request.json();
    if (!Array.isArray(productsArray)) {
      return NextResponse.json({ error: 'Ожидается массив товаров' }, { status: 400 });
    }

    const settings = await prisma.integrationSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Интеграция не настроена в базе' }, { status: 404 });
    }

    const result = await syncProducts(settings as any, productsArray);
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('Error in products webhook:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при обработке вебхука' }, { status: 500 });
  }
}
