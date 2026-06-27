import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { resolveStoreFromRequest } from '@/lib/store/resolve-store';

export async function GET(request: Request) {
  try {
    const store = await resolveStoreFromRequest(request);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ cartItems: [] });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id, storeId: store.id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ cartItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const store = await resolveStoreFromRequest(request);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { productId, quantity } = await request.json();
    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'Неvernye dannye' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, productId, storeId: store.id },
      });
      return NextResponse.json({ success: true, message: 'Товар удален из корзины' });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      update: { quantity },
      create: {
        userId: user.id,
        productId,
        quantity,
        storeId: store.id,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ success: true, cartItem });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const store = await resolveStoreFromRequest(request);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, productId, storeId: store.id },
      });
    } else {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, storeId: store.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
