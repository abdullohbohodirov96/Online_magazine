import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const where: any = { isActive: true };

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
