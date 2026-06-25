import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-grocery-marketplace-2026';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signJWT(payload: { userId: string; phone: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as { userId: string; phone: string; role: string };
  } catch (e) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    return user;
  } catch (error) {
    return null;
  }
}
