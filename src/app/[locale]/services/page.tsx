import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ServicesList } from '@/components/services/services-list';
import { ServicesFilter } from '@/components/services/services-filter';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Services | Services Marketplace',
  description: 'Browse our professional services',
};

export default function ServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; type?: string; search?: string; page?: string };
}) {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">{t('services.title')}</h1>
            <p className="text-muted-foreground text-lg">{t('services.subtitle')}</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <aside className="w-full lg:w-64 shrink-0">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <ServicesFilter
                    currentCategory={searchParams.category}
                    currentType={searchParams.type}
                    locale={locale}
                  />
                </Suspense>
              </aside>

              {/* Services Grid */}
              <div className="flex-1">
                <Suspense fallback={<ServicesListSkeleton />}>
                  <ServicesList
                    category={searchParams.category}
                    type={searchParams.type}
                    search={searchParams.search}
                    page={parseInt(searchParams.page || '1')}
                    locale={locale}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ServicesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-80 w-full rounded-lg" />
      ))}
    </div>
  );
}
