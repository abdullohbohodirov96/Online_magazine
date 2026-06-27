import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function verifySuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        storeUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });
    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { name, slug, primaryColor, description, ownerPhone } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Название и slug обязательны' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existing = await prisma.store.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json({ error: 'Магазин с таким slug уже существует' }, { status: 400 });
    }

    // Resolve owner if phone provided
    let ownerId: string | null = null;
    if (ownerPhone) {
      const ownerUser = await prisma.user.findUnique({
        where: { phone: ownerPhone },
      });
      if (!ownerUser) {
        return NextResponse.json({ error: 'Пользователь с таким телефоном не найден. Сначала зарегистрируйте его.' }, { status: 400 });
      }
      ownerId = ownerUser.id;
    }

    const store = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name,
          slug: cleanSlug,
          primaryColor: primaryColor || '#10b981',
          description: description || null,
        },
      });

      // Create defaults
      await tx.telegramSettings.create({
        data: {
          storeId: newStore.id,
        },
      });

      await tx.sMSSettings.create({
        data: {
          storeId: newStore.id,
          provider: 'mock',
        },
      });

      await tx.integrationSettings.create({
        data: {
          storeId: newStore.id,
          integrationEnabled: false,
          integrationMode: 'disabled',
        },
      });

      // Link owner if resolved
      if (ownerId) {
        await tx.storeUser.create({
          data: {
            storeId: newStore.id,
            userId: ownerId,
            role: 'STORE_OWNER',
          },
        });
        
        // Ensure owner user has STORE_OWNER role if they are CUSTOMER
        const userObj = await tx.user.findUnique({ where: { id: ownerId } });
        if (userObj && userObj.role === 'CUSTOMER') {
          await tx.user.update({
            where: { id: ownerId },
            data: { role: 'STORE_OWNER' },
          });
        }
      }

      return newStore;
    });

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Ошибка сервера при создании магазина: ' + (error.message || error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, isActive, name, primaryColor, description, ownerPhone } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID магазина обязателен' }, { status: 400 });
    }

    const payload: any = {};
    if (isActive !== undefined) payload.isActive = Boolean(isActive);
    if (name !== undefined) payload.name = name;
    if (primaryColor !== undefined) payload.primaryColor = primaryColor;
    if (description !== undefined) payload.description = description;

    // Check if new owner needs to be linked
    if (ownerPhone) {
      const ownerUser = await prisma.user.findUnique({
        where: { phone: ownerPhone },
      });
      if (!ownerUser) {
        return NextResponse.json({ error: 'Пользователь с таким телефоном не найден.' }, { status: 400 });
      }
      
      // Upsert STORE_OWNER connection
      await prisma.storeUser.upsert({
        where: {
          storeId_userId: {
            storeId: id,
            userId: ownerUser.id
          }
        },
        update: {
          role: 'STORE_OWNER'
        },
        create: {
          storeId: id,
          userId: ownerUser.id,
          role: 'STORE_OWNER'
        }
      });

      if (ownerUser.role === 'CUSTOMER') {
        await prisma.user.update({
          where: { id: ownerUser.id },
          data: { role: 'STORE_OWNER' },
        });
      }
    }

    const store = await prisma.store.update({
      where: { id },
      data: payload,
    });

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Ошибка сервера при обновлении магазина' }, { status: 500 });
  }
}
