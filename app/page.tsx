import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0; // Dynamic server page

export default async function LandingPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center px-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            SaaS Platformamizga Xush Kelibsiz!
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-md mx-auto">
            Hozirda hech qanday faol do'kon topilmadi. Tizim administratori orqali yangi do'kon yaratishingiz mumkin.
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
}
