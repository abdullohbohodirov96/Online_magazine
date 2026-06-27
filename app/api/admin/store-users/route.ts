import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/store/security';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

export async function GET(request: Request) {
  try {
    const { authorized, store } = await verifyAdminAccess(request);
    if (!authorized || !store) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const storeUsers = await prisma.storeUser.findMany({
      where: { storeId: store.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json({ storeUsers });
  } catch (error) {
    console.error('Error fetching store users:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, store } = await verifyAdminAccess(request);
    if (!authorized || !store) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { name, phone, password, role } = await request.json();

    if (!phone || !password || !name) {
      return NextResponse.json({ error: 'Имя, телефон и пароль обязательны' }, { status: 400 });
    }

    const targetRole = role === 'STORE_OWNER' ? 'STORE_OWNER' : 'STORE_ADMIN';

    // Hash password
    const passwordHash = await hashPassword(password);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          phone,
          name,
          passwordHash,
          role: targetRole,
        }
      });
    } else {
      // Update role if they are customer
      if (user.role === 'CUSTOMER') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: targetRole }
        });
      }
    }

    // Link to store
    const link = await prisma.storeUser.upsert({
      where: {
        storeId_userId: {
          storeId: store.id,
          userId: user.id,
        }
      },
      update: {
        role: targetRole,
      },
      create: {
        storeId: store.id,
        userId: user.id,
        role: targetRole,
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, role: link.role } });
  } catch (error: any) {
    console.error('Error creating store admin:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { authorized, store } = await verifyAdminAccess(request);
    if (!authorized || !store) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 });
    }

    // Prevent unlinking the last owner
    const owners = await prisma.storeUser.findMany({
      where: { storeId: store.id, role: 'STORE_OWNER' },
    });

    const targetLink = await prisma.storeUser.findUnique({
      where: {
        storeId_userId: {
          storeId: store.id,
          userId
        }
      }
    });

    if (targetLink?.role === 'STORE_OWNER' && owners.length <= 1) {
      return NextResponse.json({ error: 'Нельзя удалить единственного владельца магазина' }, { status: 400 });
    }

    await prisma.storeUser.delete({
      where: {
        storeId_userId: {
          storeId: store.id,
          userId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting store user link:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
