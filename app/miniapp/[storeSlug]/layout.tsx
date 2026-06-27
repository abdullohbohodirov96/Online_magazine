import { resolveStore } from '@/lib/store/resolve-store';
import { notFound } from 'next/navigation';

export default async function MiniAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await resolveStore(storeSlug);

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
        }
        html:not([data-theme='dark']) {
          --background: ${store.backgroundColor || '#f8fafc'};
          --foreground: ${store.textColor || '#0f172a'};
        }
      ` }} />
      {children}
    </>
  );
}
