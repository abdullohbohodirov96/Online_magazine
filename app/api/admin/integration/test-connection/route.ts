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

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { url, apiKey } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL обязателен для проверки' }, { status: 400 });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
          'Authorization': `Bearer ${apiKey || ''}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      await prisma.integrationLog.create({
        data: {
          type: 'TEST_CONNECTION',
          status: 'SUCCESS',
          message: `Проверка соединения с ${url} прошла успешно. Код ответа: ${response.status}`,
        },
      });

      return NextResponse.json({ success: true, message: `Соединение установлено. Статус: ${response.status} ${response.statusText}` });
    } catch (e: any) {
      await prisma.integrationLog.create({
        data: {
          type: 'TEST_CONNECTION',
          status: 'ERROR',
          message: `Ошибка проверки соединения с ${url}: ${e.message || e}`,
        },
      });

      return NextResponse.json({ 
        error: `Не удалось установить соединение: ${e.message || 'Таймаут или ошибка сети'}` 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
