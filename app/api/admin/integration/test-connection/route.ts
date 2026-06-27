import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { testConnection } from '@/lib/integrations/integration-service';
import { verifyAdminAccess } from '@/lib/store/security';

export async function POST(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { url, apiKey, authType, requestMethod } = data;

    if (!url) {
      return NextResponse.json({ error: 'URL обязателен для проверки' }, { status: 400 });
    }

    const testSettings: any = {
      integrationApiUrl: url,
      integrationApiKey: apiKey || null,
      authType: authType || 'none',
      requestMethod: requestMethod || 'GET',
    };

    const result = await testConnection(testSettings);

    // Save connection status to DB
    const settings = await prisma.integrationSettings.findUnique({
      where: { storeId: store.id },
    });
    if (settings) {
      await prisma.integrationSettings.update({
        where: { storeId: store.id },
        data: {
          isConnected: result.success,
          lastConnectionCheckAt: new Date(),
        },
      });
    }

    await prisma.integrationLog.create({
      data: {
        type: 'TEST_CONNECTION',
        status: result.success ? 'SUCCESS' : 'ERROR',
        message: `[${store.name}] Проверка соединения с ${url}: ${result.message}`,
      },
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера: ' + (error.message || error) }, { status: 500 });
  }
}
