import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      message: error.message || String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
