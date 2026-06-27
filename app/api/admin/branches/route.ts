import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/store/security';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { authorized, store } = await verifyAdminAccess(request);
    if (!authorized || !store) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { name, phone, address, latitude, longitude } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Имя филиала обязательно' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        storeId: store.id,
        name,
        phone: phone || null,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { authorized, store } = await verifyAdminAccess(request);
    if (!authorized || !store) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID филиала обязателен' }, { status: 400 });
    }

    // Verify branch belongs to the active store
    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.storeId !== store.id) {
      return NextResponse.json({ error: 'Филиал не найден' }, { status: 404 });
    }

    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
