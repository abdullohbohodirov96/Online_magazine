import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const checks = {
      OtpCode: false,
      Category: false,
      Product: false,
      User: false,
      IntegrationSettings: false,
      ExternalProduct: false,
    };
    
    try { await prisma.otpCode.findMany({ take: 1 }); checks.OtpCode = true; } catch (e) {}
    try { await prisma.category.findMany({ take: 1 }); checks.Category = true; } catch (e) {}
    try { await prisma.product.findMany({ take: 1 }); checks.Product = true; } catch (e) {}
    try { await prisma.user.findMany({ take: 1 }); checks.User = true; } catch (e) {}
    try { await prisma.integrationSettings.findMany({ take: 1 }); checks.IntegrationSettings = true; } catch (e) {}
    try { await prisma.externalProduct.findMany({ take: 1 }); checks.ExternalProduct = true; } catch (e) {}

    const allExist = Object.values(checks).every(Boolean);

    return NextResponse.json({
      status: allExist ? 'ok' : 'partial',
      database: 'connected',
      tables: checks,
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