import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { 
      name, barcode, nomenclatureCode, description, price, oldPrice, stock, unit, image, categoryId, isActive,
      externalProductId, source, syncPrice, syncStock
    } = await request.json();

    if (!name || price === undefined || stock === undefined || !unit) {
      return NextResponse.json({ error: 'Заполните обязательные поля: название, цена, остаток, единица измерения' }, { status: 400 });
    }

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9а-яё]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 10000);

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        slug,
        barcode: barcode || null,
        nomenclatureCode: nomenclatureCode || null,
        description: description || null,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock),
        unit,
        image: image || null,
        categoryId: categoryId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        externalProductId: externalProductId || null,
        source: source || 'manual',
        syncPrice: syncPrice !== undefined ? Boolean(syncPrice) : true,
        syncStock: syncStock !== undefined ? Boolean(syncStock) : true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Товар с таким штрихкодом, кодом номенклатуры или slug уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка сервера при создании товара' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { 
      id, name, barcode, nomenclatureCode, description, price, oldPrice, stock, unit, image, categoryId, isActive,
      externalProductId, source, syncPrice, syncStock
    } = await request.json();

    if (!id || !name || price === undefined || stock === undefined || !unit) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
    }

    // Verify product belongs to store
    const existing = await prisma.product.findFirst({
      where: { id, storeId: store.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        barcode: barcode || null,
        nomenclatureCode: nomenclatureCode || null,
        description: description || null,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock),
        unit,
        image: image || null,
        categoryId: categoryId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        externalProductId: externalProductId || null,
        source: source || 'manual',
        syncPrice: syncPrice !== undefined ? Boolean(syncPrice) : true,
        syncStock: syncStock !== undefined ? Boolean(syncStock) : true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Товар с таким штрихкодом или кодом номенклатуры уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка сервера при обновлении товара' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID товара обязателен' }, { status: 400 });
    }

    // Verify product belongs to store
    const existing = await prisma.product.findFirst({
      where: { id, storeId: store.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Ошибка сервера при удалении товара' }, { status: 500 });
  }
}
