'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescEn: string;
  shortDescAr: string;
  image: string | null;
  type: string;
  averageRating: number;
  totalReviews: number;
  category: {
    nameEn: string;
    nameAr: string;
    slug: string;
  };
  pricingTiers: Array<{
    tier: string;
    price: number;
    deliveryDays: number;
  }>;
}

interface ServicesListProps {
  category?: string;
  type?: string;
  search?: string;
  page: number;
  locale: string;
}

export function ServicesList({ category, type, search, page, locale }: ServicesListProps) {
  const t = useTranslations();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const isArabic = locale === 'ar';

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (type) params.set('type', type);
        if (search) params.set('search', search);
        params.set('page', page.toString());
        params.set('limit', '12');

        const response = await fetch(`/api/services?${params}`);
        const data = await response.json();

        if (response.ok) {
          setServices(data.services);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [category, type, search, page]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('common.noResults')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service) => {
          const lowestPrice = service.pricingTiers.length > 0
            ? Math.min(...service.pricingTiers.map((t) => Number(t.price)))
            : null;
          const fastestDelivery = service.pricingTiers.length > 0
            ? Math.min(...service.pricingTiers.map((t) => t.deliveryDays))
            : null;

          return (
            <Link key={service.id} href={`/${locale}/services/${service.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all group overflow-hidden">
                <div className="relative h-48 bg-muted">
                  {service.image ? (
                    <Image
                      src={service.image}
                      alt={isArabic ? service.nameAr : service.nameEn}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-4xl font-bold text-primary/30">
                        {(isArabic ? service.nameAr : service.nameEn)[0]}
                      </span>
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3" variant="secondary">
                    {isArabic ? service.category.nameAr : service.category.nameEn}
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {isArabic ? service.nameAr : service.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {isArabic ? service.shortDescAr : service.shortDescEn}
                  </p>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="flex items-center gap-4 text-sm">
                    {service.totalReviews > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{Number(service.averageRating).toFixed(1)}</span>
                        <span className="text-muted-foreground">({service.totalReviews})</span>
                      </div>
                    )}
                    {fastestDelivery && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{fastestDelivery} {t('services.days', { count: fastestDelivery })}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between pt-2 border-t">
                  {lowestPrice !== null ? (
                    <div>
                      <span className="text-xs text-muted-foreground">Starting at</span>
                      <p className="font-bold text-lg">{formatCurrency(lowestPrice)}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('services.requestQuote')}</span>
                  )}
                  <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    {t('services.viewDetails')}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(pagination.totalPages)].map((_, i) => (
            <Link
              key={i}
              href={`/${locale}/services?page=${i + 1}${category ? `&category=${category}` : ''}${type ? `&type=${type}` : ''}`}
            >
              <Button
                variant={page === i + 1 ? 'default' : 'outline'}
                size="sm"
              >
                {i + 1}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
