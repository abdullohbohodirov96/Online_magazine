import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-integration-key');
    const secretKey = process.env.INTEGRATION_SECRET_KEY;

    if (!secretKey || key !== secretKey) {
      return NextResponse.json({ error: 'Доступ запрещен: невалидный x-integration-key' }, { status: 403 });
    }

    const { orderId, status } = await request.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId и status обязательны' }, { status: 400 });
    }

    const allowedStatuses = ['NEW', 'ACCEPTED', 'ASSEMBLING', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Невалидный статус' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error in order-status webhook:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при обработке вебхука' }, { status: 500 });
  }
}
