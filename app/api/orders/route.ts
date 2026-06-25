import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Пожалуйста, авторизуйтесь для оформления заказа' }, { status: 401 });
    }

    const { customerName, phone, address, comment } = await request.json();

    if (!customerName || !phone || !address) {
      return NextResponse.json({ error: 'Имя, телефон и адрес обязательны' }, { status: 400 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Ваша корзина пуста' }, { status: 400 });
    }

    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json({
          error: `Недостаточно товара "${item.product.name}" на складе. Доступно: ${item.product.stock} ${item.product.unit}`,
        }, { status: 400 });
      }
      totalAmount += item.product.price * item.quantity;
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          customerName,
          phone,
          address,
          comment,
          totalAmount,
          status: 'NEW',
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              total: item.product.price * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Ошибка сервера при оформлении заказа' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
