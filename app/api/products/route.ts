import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveStoreFromRequest } from '@/lib/store/resolve-store';

export async function GET(request: Request) {
  try {
    const store = await resolveStoreFromRequest(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');

    const categories = await prisma.category.findMany({
      where: { isActive: true, storeId: store.id },
      orderBy: { name: 'asc' },
    });

    const where: any = { isActive: true, storeId: store.id };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ categories, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
