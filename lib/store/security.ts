import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { resolveStoreFromRequest } from './resolve-store';

export async function canAccessStore(
  userId: string,
  storeId: string,
  requiredRole?: 'STORE_OWNER' | 'STORE_ADMIN'
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      storeUsers: {
        where: { storeId }
      }
    }
  });

  if (!user) return false;

  // SUPER_ADMIN has access to everything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Find store role mapping
  const storeUser = user.storeUsers[0];
  if (!storeUser) return false;

  if (requiredRole === 'STORE_OWNER') {
    return storeUser.role === 'STORE_OWNER';
  }

  // If STORE_ADMIN is required or any role is accepted (STORE_OWNER or STORE_ADMIN)
  return storeUser.role === 'STORE_OWNER' || storeUser.role === 'STORE_ADMIN';
}

export async function verifyAdminAccess(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'STORE_OWNER' && user.role !== 'STORE_ADMIN' && user.role !== 'ADMIN')) {
    return { authorized: false, user: null, store: null, reason: 'unauthorized' };
  }
  const store = await resolveStoreFromRequest(request);
  const authorized = await canAccessStore(user.id, store.id);
  if (!authorized) {
    return { authorized: false, user, store, reason: 'no_store_access' };
  }
  return { authorized: true, user, store };
}
