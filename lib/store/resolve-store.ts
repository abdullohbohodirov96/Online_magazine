import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export async function getStoreBySlug(slug: string) {
  return prisma.store.findUnique({
    where: { slug, isActive: true },
    include: {
      telegramSettings: true,
      smsSettings: true,
      integrationSettings: true,
    }
  });
}

export async function getStoreByDomain(domain: string) {
  const storeDomain = await prisma.storeDomain.findUnique({
    where: { domain },
    include: {
      store: {
        include: {
          telegramSettings: true,
          smsSettings: true,
          integrationSettings: true,
        }
      }
    }
  });
  if (storeDomain && storeDomain.store.isActive) {
    return storeDomain.store;
  }
  return null;
}

export async function resolveStore(slug?: string) {
  // 1. Resolve by slug first if provided
  if (slug) {
    const store = await getStoreBySlug(slug);
    if (store) return store;
  }

  // 2. Resolve by domain
  try {
    const headersList = await headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host');
    if (host) {
      const cleanHost = host.split(':')[0];
      if (cleanHost && cleanHost !== 'localhost' && !cleanHost.includes('vercel.app')) {
        const store = await getStoreByDomain(cleanHost);
        if (store) return store;
      }
    }
  } catch (e) {
    // headers() might fail outside request scope
  }

  // 3. Fallback to default
  const defaultStore = await getStoreBySlug('bozor-market');
  if (!defaultStore) {
    const anyStore = await prisma.store.findFirst({
      where: { isActive: true },
      include: {
        telegramSettings: true,
        smsSettings: true,
        integrationSettings: true,
      }
    });
    if (anyStore) return anyStore;
    throw new Error('Default store bozor-market not found');
  }
  return defaultStore;
}

export async function resolveStoreFromRequest(request: Request) {
  // 1. Check x-store-slug header
  const storeSlug = request.headers.get('x-store-slug');
  if (storeSlug) {
    const store = await getStoreBySlug(storeSlug);
    if (store) return store;
  }

  // 2. Check admin_store_slug cookie
  try {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const val = parts.slice(1).join('=');
          acc[key] = val;
        }
        return acc;
      }, {} as Record<string, string>);
      if (cookies['admin_store_slug']) {
        const store = await getStoreBySlug(cookies['admin_store_slug']);
        if (store) return store;
      }
    }
  } catch (e) {}

  // 3. Check referer / origin URL for /store/[storeSlug] or /miniapp/[storeSlug]
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      const parts = url.pathname.split('/');
      if (parts[1] === 'store' || parts[1] === 'miniapp') {
        const store = await getStoreBySlug(parts[2]);
        if (store) return store;
      }
    } catch (e) {}
  }

  // 4. Resolve by hostname
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (host) {
    const cleanHost = host.split(':')[0];
    if (cleanHost && cleanHost !== 'localhost' && !cleanHost.includes('vercel.app')) {
      const store = await getStoreByDomain(cleanHost);
      if (store) return store;
    }
  }

  // 5. Fallback to default
  const defaultStore = await getStoreBySlug('bozor-market');
  if (!defaultStore) {
    const anyStore = await prisma.store.findFirst({
      where: { isActive: true },
      include: {
        telegramSettings: true,
        smsSettings: true,
        integrationSettings: true,
      }
    });
    if (anyStore) return anyStore;
    throw new Error('Default store not found');
  }
  return defaultStore;
}
