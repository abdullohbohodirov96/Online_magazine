import { NextResponse } from 'next/server';
import { resolveStoreFromRequest } from '@/lib/store/resolve-store';
import { verifyAdminAccess } from '@/lib/store/security';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const resolvedStore = await resolveStoreFromRequest(request);
    const store = await prisma.store.findUnique({
      where: { id: resolvedStore.id },
      include: {
        branches: true,
        telegramSettings: true,
        smsSettings: true,
        integrationSettings: true,
      },
    });
    return NextResponse.json({ store });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { authorized, store } = await verifyAdminAccess(request);
    if (!authorized || !store) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const data = await request.json();
    const {
      name,
      description,
      logoUrl,
      bannerUrl,
      primaryColor,
      backgroundColor,
      textColor,
      telegramUsername,
      instagramUsername,
      facebookUrl,
      youtubeUrl,
    } = data;

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
        primaryColor: primaryColor !== undefined ? primaryColor : undefined,
        backgroundColor: backgroundColor !== undefined ? backgroundColor : undefined,
        textColor: textColor !== undefined ? textColor : undefined,
        telegramUsername: telegramUsername !== undefined ? telegramUsername : undefined,
        instagramUsername: instagramUsername !== undefined ? instagramUsername : undefined,
        facebookUrl: facebookUrl !== undefined ? facebookUrl : undefined,
        youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : undefined,
      },
    });

    return NextResponse.json({ success: true, store: updatedStore });
  } catch (error: any) {
    console.error('Error updating store branding:', error);
    return NextResponse.json({ error: 'Ошибка сервера при обновлении брендинга' }, { status: 500 });
  }
}
