import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const orderId = body.orderId || body.id;
    const status = body.status;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
    }

    // Verify order belongs to store
    const existing = await prisma.order.findFirst({
      where: { id: orderId, storeId: store.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
