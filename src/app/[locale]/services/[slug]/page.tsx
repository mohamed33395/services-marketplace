import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ServiceDetails } from '@/components/services/service-details';

interface ServicePageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: ServicePageProps) {
  const service = await prisma.service.findFirst({
    where: { slug: params.slug, isActive: true },
  });

  if (!service) {
    return { title: 'Service Not Found' };
  }

  return {
    title: `${params.locale === 'ar' ? service.nameAr : service.nameEn} | Services Marketplace`,
    description: params.locale === 'ar' ? service.shortDescAr : service.shortDescEn,
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { locale, slug } = params;

  const service = await prisma.service.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      subcategory: true,
      pricingTiers: {
        where: { isActive: true },
        orderBy: { tier: 'asc' },
      },
      addOns: {
        where: { isActive: true },
      },
      packages: {
        where: { isActive: true },
      },
      bookingConfig: {
        include: {
          timeSlots: {
            where: { isActive: true },
          },
        },
      },
      subscriptionPlans: {
        where: { isActive: true },
      },
      reviews: {
        where: { isVisible: true },
        include: {
          order: {
            include: {
              customer: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ServiceDetails service={service} locale={locale} />
      </main>
      <Footer />
    </div>
  );
}
