import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Параметр query обязателен' }, { status: 400 });
  }

  try {
    const settings = await prisma.integrationSettings.findUnique({
      where: { storeId: store.id },
    });
    
    if (!settings || !settings.integrationEnabled) {
      return NextResponse.json({ 
        message: 'Интеграция не подключена',
        products: [] 
      });
    }

    const externalProducts = await prisma.externalProduct.findMany({
      where: {
        storeId: store.id,
        OR: [
          { barcode: query },
          { nomenclatureCode: query },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    if (externalProducts.length > 0) {
      return NextResponse.json({ products: externalProducts });
    }

    if (settings.integrationMode === 'external_api' && settings.integrationApiUrl) {
      try {
        const apiKey = settings.integrationApiKey || '';
        const fetchUrl = `${settings.integrationApiUrl}?query=${encodeURIComponent(query)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          let extProducts = Array.isArray(data) ? data : [data];
          extProducts = extProducts.filter(p => p && p.name && (p.price !== undefined) && (p.stock !== undefined));
          
          if (extProducts.length > 0) {
            await prisma.integrationLog.create({
              data: {
                type: 'EXTERNAL_API_LOOKUP',
                status: 'SUCCESS',
                message: `[${store.name}] Найден товар во внешнем API по запросу "${query}"`,
              },
            });
            
            const mapped = extProducts.map(p => ({
              id: p.id || 'ext-' + Math.random().toString(36).slice(2),
              barcode: p.barcode || null,
              nomenclatureCode: p.nomenclatureCode || null,
              name: p.name,
              price: Number(p.price),
              stock: Number(p.stock),
              unit: p.unit || 'шт',
              categoryName: p.categoryName || 'Другое',
              lastSyncedAt: new Date(),
            }));
            
            return NextResponse.json({ products: mapped });
          }
        }
      } catch (err: any) {
        console.error('External API lookup failed:', err);
        await prisma.integrationLog.create({
          data: {
            type: 'EXTERNAL_API_LOOKUP',
            status: 'ERROR',
            message: `[${store.name}] Не удалось связаться с внешним API по запросу "${query}": ${err.message || err}`,
          },
        });
      }
    }

    return NextResponse.json({ 
      message: 'Товар не найден',
      products: [] 
    });
  } catch (error) {
    console.error('Error searching integration products:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
