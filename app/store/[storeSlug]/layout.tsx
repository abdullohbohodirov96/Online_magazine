import { resolveStore } from '@/lib/store/resolve-store';
import { notFound } from 'next/navigation';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  
  let store = null;
  try {
    store = await resolveStore(storeSlug);
  } catch (error: any) {
    console.error('Database connection error in StoreLayout:', error);
    const errorDetails = error.message || String(error);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ maxWidth: '650px', width: '100%', backgroundColor: '#1e293b', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>⚙️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: '#f43f5e', textAlign: 'center' }}>
            Neon Bazaga Ulanish Xatoligi (Prisma Setup Required)
          </h1>
          
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem 1.25rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
            <strong>Xatolik tafsiloti (Error message):</strong><br />
            {errorDetails}
          </div>

          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Production ma'lumotlar bazasida (Neon) jadvallar yaratilmagan yoki migratsiya bajarilmagan. Quyidagi qadamlarni o'z terminalingizda bajarib do'konni ishga tushiring:
          </p>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>1-qadam. Migratsiyalarni Neon bazaga yuborish:</h3>
          <div style={{ backgroundColor: '#0f172a', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#34d399', border: '1px solid #1e293b', marginBottom: '1.25rem', overflowX: 'auto' }}>
            DATABASE_URL="Sizning_Neon_Postgres_Url" npx prisma migrate deploy
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>2-qadam. Default do'konni va admin profilini yaratish (Seed):</h3>
          <div style={{ backgroundColor: '#0f172a', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#34d399', border: '1px solid #1e293b', marginBottom: '1.5rem', overflowX: 'auto' }}>
            DATABASE_URL="Sizning_Neon_Postgres_Url" node prisma/seed.js
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            * <em>Sizning_Neon_Postgres_Url</em> ni Vercel dashboard sozlamalaridan (Environment Variables ichidan) yoki Neon.tech saytidagi loyihangizdan olishingiz mumkin.
          </p>
        </div>
      </div>
    );
  }

  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-color: ${store.primaryColor || '#10b981'};
          --primary-hover: ${store.primaryColor}ee;
          --primary-light: ${store.primaryColor}15;
          --background: ${store.backgroundColor || '#f8fafc'};
          --foreground: ${store.textColor || '#0f172a'};
        }
      ` }} />
      {children}
    </>
  );
}
