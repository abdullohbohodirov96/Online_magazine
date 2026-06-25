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

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const categories = await prisma.category.findMany({
      include: { parent: true, children: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { name, slug, image, parentId, isActive } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Имя категории обязательно' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9а-яё]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 10000);

    const category = await prisma.category.create({
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
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Категория с таким slug уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка сервера при создании категории' }, { status: 500 });
  }
}
