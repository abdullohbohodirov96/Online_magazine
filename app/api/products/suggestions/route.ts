import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveStoreFromRequest } from '@/lib/store/resolve-store';

export async function GET(request: Request) {
  try {
    const store = await resolveStoreFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        image: true,
      },
      take: 8,
    });

    return NextResponse.json({ suggestions: products });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
