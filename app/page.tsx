import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0; // Dynamic server page

interface PageProps {
  searchParams: Promise<{ landing?: string }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const showLanding = resolvedParams.landing === 'true';

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

    // Auto-redirect shopper to default store if only one exists and they didn't ask for SaaS landing page
    if (stores.length === 1 && !showLanding) {
      redirect(`/store/${stores[0].slug}`);
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        
        {/* Navbar */}
        <header style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🍎 SaaSBozor
            </span>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <Link href="/admin" style={{ color: '#94a3b8' }}>Admin Panel</Link>
              <Link href="/admin/super" style={{ color: '#8b5cf6' }}>Super Admin</Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main style={{ flexGrow: 1 }}>
          <section style={{ padding: '5rem 2rem', textAlign: 'center', background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', borderBottom: '1px solid #1e293b' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                XUSH KELIBSIZ!
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, marginTop: '1.5rem', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                O'z Online Do'koningizni <span style={{ color: '#10b981' }}>Hoziroq Yarating</span>
              </h1>
              <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Bizning SaaS platformamiz yordamida oziq-ovqat yoki boshqa mahsulotlar savdosi uchun bir necha daqiqada shaxsiy do'koningiz, telegram botingiz va boshqaruv panelini ishga tushiring. Tizim telefon va kompyuterlarda mukammal darajada moslashadi!
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link href="/admin/super" style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.75rem', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                  Do'kon ochish
                </Link>
                {stores.length > 0 && (
                  <Link href={`/store/${stores[0].slug}`} style={{ padding: '0.75rem 2rem', backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem', fontWeight: 700, border: '1px solid #334155' }}>
                    Demo do'konga kirish
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>Platforma imkoniyatlari</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Responsive dizayn</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Kompyuter, planshet hamda telefon ekranlari uchun to'liq moslashuvchan premium interfeys.
                </p>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Telegram Bot va Mini App</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Har bir do'konga shaxsiy Telegram botini ulash va buyurtmalarni bot orqali Mini Appda qabul qilish imkoniyati.
                </p>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗺️</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Yandex Xarita va Manzil Suggest</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Yozilgan manzillarni xaritada topish va takliflar ro'yxatidan oson tanlash (Geocoding autocomplete).
                </p>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Qidiruv Autocomplete takliflari</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Mahsulotlarni qidirishda yozilayotgan so'zga qarab takliflar va rasmlarni tezkor ko'rsatib berish.
                </p>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌐</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tillarni tanlash (UZ / RU)</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Sayt va Mini Appda foydalanuvchilar o'zlari istagan tilni (o'zbekcha yoki ruscha) tanlashlari mumkin.
                </p>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌙</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dark / Light rejimlari</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Ko'zga zarar yetkazmasligi uchun tungi va kunduzgi premium dizayn rejimlariga bir marta bosishda o'tish.
                </p>
              </div>
            </div>
          </section>

          {/* Active Storefronts List */}
          <section style={{ backgroundColor: '#1e293b', borderTop: '1px solid #334155', padding: '5rem 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>
                Mavjud do'konlar ({stores.length})
              </h2>

              {stores.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Tizimda hali faol do'konlar yaratilmagan.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {stores.map((s) => (
                    <div key={s.id} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', backgroundColor: '#1e293b' }} />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: s.primaryColor || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>
                              {s.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 style={{ fontWeight: 700, margin: 0 }}>{s.name}</h4>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>@{s.slug}</span>
                          </div>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }} className="line-clamp-3">
                          {s.description || 'Ushbu do\'kon haqida ma\'lumotlar yaqin orada qo\'shiladi.'}
                        </p>
                      </div>

                      <Link href={`/store/${s.slug}`} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem 1rem', backgroundColor: s.primaryColor || '#10b981', color: 'white', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                        Do'konga kirish
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '2.5rem 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              &copy; {new Date().getFullYear()} SaaSBozor Marketplace. Barcha huquqlar himoyalangan.
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Aloqa: +998 (91) 785-00-90
            </span>
          </div>
        </footer>
      </div>
    );
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT' || (error.digest && error.digest.startsWith('NEXT_REDIRECT'))) {
      throw error;
    }
    console.error('Database connection error in root page:', error);
    const errorDetails = error.message || String(error);
    
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ maxWidth: '650px', width: '100%', backgroundColor: '#1e293b', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', textAlign: 'left' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>⚙️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: '#f43f5e', textAlign: 'center' }}>
            Neon Bazaga Ulanish Xatoligi (Prisma Setup Required)
          </h1>
          
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem 1.25rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
            <strong>Xatolik tafsiloti (Error message):</strong><br />
            {errorDetails}
          </div>

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
