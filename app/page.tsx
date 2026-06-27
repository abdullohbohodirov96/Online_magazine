// Trigger redeploy v1.0.1
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0; // Dynamic server page

export default async function LandingPage() {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        primaryColor: true,
      },
    });

    if (stores.length === 1) {
      redirect(`/store/${stores[0].slug}`);
    }

    if (stores.length === 0) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: '#1e293b', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>🗄️</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: '#38bdf8' }}>
              Baza bo'sh (No Stores Seeded)
            </h1>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
              Ma'lumotlar bazasi muvaffaqiyatli ulangan, biroq platformada hali birorta ham do'kon mavjud emas. Quyidagi buyruqni terminalda ishga tushirib do'konni yarating:
            </p>
            <div style={{ backgroundColor: '#0f172a', padding: '1rem 1.5rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem', color: '#34d399', textAlign: 'left', border: '1px solid #1e293b', marginBottom: '2rem', overflowX: 'auto' }}>
              node prisma/seed.js
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Agar local database bo'lsa, localda ishga tushiring. Agar Neon (production) bo'lsa, Neon DATABASE_URL orqali ishga tushiring.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
              Bizning Onlayn Do'konlarimiz
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
              Platformamizdagi eng yaxshi do'konlarni tanlang va qulay buyurtma bering
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                          style={{ backgroundColor: store.primaryColor || '#10b981' }}
                        >
                          {store.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
                        <span className="text-sm text-gray-500">@{store.slug}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 line-clamp-3 mb-6">
                      {store.description || "Ushbu do'kon haqida ma'lumotlar tez orada qo'shiladi."}
                    </p>
                  </div>

                  <Link
                    href={`/store/${store.slug}`}
                    className="w-full text-center py-3 px-4 rounded-xl text-white font-medium transition-all duration-200"
                    style={{
                      backgroundColor: store.primaryColor || '#10b981',
                      filter: 'brightness(0.95)',
                    }}
                  >
                    Do'konga kirish
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-12 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} SaaS Marketplace Platform. Barcha huquqlar himoyalangan.
        </div>
      </div>
    );
  } catch (error: any) {
    console.error('Database connection error in root page:', error);
    
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ maxWidth: '650px', width: '100%', backgroundColor: '#1e293b', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', textAlign: 'left' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>⚙️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: '#f43f5e', textAlign: 'center' }}>
            Neon Bazaga Ulanish Xatoligi (Prisma Setup Required)
          </h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Production ma'lumotlar bazasida (Neon) jadvallar yaratilmagan yoki migratsiya bajarilmagan. Quyidagi qadamlarni o'z terminalingizda bajarib tizimni ishga tushiring:
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
}
