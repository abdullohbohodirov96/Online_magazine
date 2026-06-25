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
    const productsArray = await request.json();

    if (!Array.isArray(productsArray)) {
      return NextResponse.json({ error: 'Неверный формат данных, ожидается массив' }, { status: 400 });
    }

    let extCreated = 0;
    let extUpdated = 0;
    let shopUpdated = 0;

    const settings = await prisma.integrationSettings.findFirst();
    const autoPrice = settings?.autoUpdatePrices ?? true;
    const autoStock = settings?.autoUpdateStock ?? true;

    for (const item of productsArray) {
      const { barcode, nomenclatureCode, name, price, stock, unit, categoryName } = item;

      if (!name || price === undefined || stock === undefined || !unit) {
        throw new Error(`Пропущены обязательные поля для товара: ${JSON.stringify(item)}`);
      }

      let externalProduct = null;

      if (barcode) {
        externalProduct = await prisma.externalProduct.findUnique({
          where: { barcode },
        });
      }

      if (!externalProduct && nomenclatureCode) {
        externalProduct = await prisma.externalProduct.findUnique({
          where: { nomenclatureCode },
        });
      }

      if (externalProduct) {
        externalProduct = await prisma.externalProduct.update({
          where: { id: externalProduct.id },
          data: {
            name,
            price: Number(price),
            stock: Number(stock),
            unit,
            categoryName: categoryName || null,
            lastSyncedAt: new Date(),
            rawData: item,
          },
        });
        extUpdated++;
      } else {
        externalProduct = await prisma.externalProduct.create({
          data: {
            barcode: barcode || null,
            nomenclatureCode: nomenclatureCode || null,
            name,
            price: Number(price),
            stock: Number(stock),
            unit,
            categoryName: categoryName || null,
            lastSyncedAt: new Date(),
            rawData: item,
          },
        });
        extCreated++;
      }

      const linkedProducts = await prisma.product.findMany({
        where: {
          OR: [
            { externalProductId: externalProduct.id },
            { 
              source: 'integration',
              OR: [
                barcode ? { barcode } : {},
                nomenclatureCode ? { nomenclatureCode } : {},
              ].filter(o => Object.keys(o).length > 0),
            },
          ],
        },
      });

      for (const prod of linkedProducts) {
        const updateData: any = {};
        
        if (!prod.externalProductId) {
          updateData.externalProductId = externalProduct.id;
        }

        if (prod.syncPrice && autoPrice) {
          updateData.price = Number(price);
        }
        if (prod.syncStock && autoStock) {
          updateData.stock = Number(stock);
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({
            where: { id: prod.id },
            data: updateData,
          });
          shopUpdated++;
        }
      }
    }

    if (settings) {
      await prisma.integrationSettings.update({
        where: { id: settings.id },
        data: { lastSyncAt: new Date() },
      });
    }

    const message = `Синхронизация с внешней программой завершена. Получено товаров: ${productsArray.length}. Добавлено во внешний список: ${extCreated}, обновлено: ${extUpdated}. На сайте обновлено товаров: ${shopUpdated}.`;

    await prisma.integrationLog.create({
      data: {
        type: 'EXTERNAL_PRODUCTS_SYNC',
        status: 'SUCCESS',
        message,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error syncing external products:', error);
    const errMessage = error.message || 'Ошибка сервера при синхронизации';

    await prisma.integrationLog.create({
      data: {
        type: 'EXTERNAL_PRODUCTS_SYNC',
        status: 'ERROR',
        message: `Ошибка: ${errMessage}`,
      },
    });

    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
