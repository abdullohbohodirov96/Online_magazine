import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const category = await prisma.category.findFirst({
      where: { id, storeId: store.id },
      include: { parent: true, children: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { name, slug, image, parentId, isActive } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Имя категории обязательно' }, { status: 400 });
    }

    if (parentId === id) {
      return NextResponse.json({ error: 'Категория не может быть своим собственным родителем' }, { status: 400 });
    }

    // Verify category belongs to store
    const existing = await prisma.category.findFirst({
      where: { id, storeId: store.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    const generatedSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9а-яё]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 10000);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug: generatedSlug,
        image: image || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Категория с таким slug уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка сервера при обновлении категории' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Verify category belongs to store
    const existing = await prisma.category.findFirst({
      where: { id, storeId: store.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    const productCount = await prisma.product.count({
      where: { categoryId: id, storeId: store.id },
    });

    if (productCount > 0) {
      return NextResponse.json({ error: 'Нельзя удалить категорию, пока в ней есть товары' }, { status: 400 });
    }

    const childCount = await prisma.category.count({
      where: { parentId: id, storeId: store.id },
    });

    if (childCount > 0) {
      return NextResponse.json({ error: 'Нельзя удалить категорию, пока у нее есть дочерние подкатегории' }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Ошибка сервера при удалении категории' }, { status: 500 });
  }
}
