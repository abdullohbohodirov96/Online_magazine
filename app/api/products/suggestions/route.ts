import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveStoreFromRequest } from '@/lib/store/resolve-store';

export async function GET(request: Request) {
  try {
    const store = await resolveStoreFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const cleanQuery = query.trim();
    if (cleanQuery.length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { description: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        image: true,
      },
      take: 25,
    });

    // Sort: items starting with the query prefix first (case-insensitive), then fallback to substring contains
    const sorted = [...products].sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(cleanQuery.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(cleanQuery.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ suggestions: sorted.slice(0, 10) });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
