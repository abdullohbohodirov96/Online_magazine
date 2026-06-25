import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const secretKey = process.env.INTEGRATION_SECRET_KEY || 'grocery-integration-key-xyz-123';
  const receivedKey = request.headers.get('x-integration-key');

  if (receivedKey !== secretKey) {
    await prisma.integrationLog.create({
      data: {
        type: 'PRODUCTS_SYNC',
        status: 'ERROR',
        message: 'Несанкционированный доступ: неверный ключ x-integration-key',
      },
    });
    return NextResponse.json({ error: 'Неавторизованный доступ' }, { status: 401 });
  }

  try {
    const productsArray = await request.json();

    if (!Array.isArray(productsArray)) {
      return NextResponse.json({ error: 'Неверный формат данных, ожидается массив' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let categoryCreatedCount = 0;

    for (const item of productsArray) {
      const { barcode, nomenclatureCode, name, price, stock, unit, categoryName } = item;

      if (!name || price === undefined || stock === undefined || !unit) {
        throw new Error(`Пропущены обязательные поля для товара: ${JSON.stringify(item)}`);
      }

      let categoryId = null;
      if (categoryName) {
        const categorySlug = categoryName.toLowerCase()
          .replace(/[^a-z0-9а-яё]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        let category = await prisma.category.findUnique({
          where: { slug: categorySlug },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: categorySlug,
              isActive: true,
            },
          });
          categoryCreatedCount++;
        }
        categoryId = category.id;
      }

      let existingProduct = null;

      if (barcode) {
        existingProduct = await prisma.product.findUnique({
          where: { barcode },
        });
      }

      if (!existingProduct && nomenclatureCode) {
        existingProduct = await prisma.product.findUnique({
          where: { nomenclatureCode },
        });
      }

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name,
            price: Number(price),
            stock: Number(stock),
            unit,
            categoryId,
          },
        });
        updatedCount++;
      } else {
        const productSlug = name.toLowerCase()
          .replace(/[^a-z0-9а-яё]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 10000);

        await prisma.product.create({
          data: {
            name,
            slug: productSlug,
            barcode: barcode || null,
            nomenclatureCode: nomenclatureCode || null,
            price: Number(price),
            stock: Number(stock),
            unit,
            categoryId,
            isActive: true,
          },
        });
        createdCount++;
      }
    }

    const logMessage = `Синхронизация успешно завершена. Обработано товаров: ${productsArray.length}. Создано: ${createdCount}, обновлено: ${updatedCount}. Создано категорий: ${categoryCreatedCount}.`;
    
    await prisma.integrationLog.create({
      data: {
        type: 'PRODUCTS_SYNC',
        status: 'SUCCESS',
        message: logMessage,
      },
    });

    return NextResponse.json({ success: true, message: logMessage });
  } catch (error: any) {
    console.error('Error syncing products:', error);
    const errMessage = error.message || 'Внутренняя ошибка сервера при синхронизации';
    
    await prisma.integrationLog.create({
      data: {
        type: 'PRODUCTS_SYNC',
        status: 'ERROR',
        message: `Ошибка синхронизации: ${errMessage}`,
      },
    });

    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
