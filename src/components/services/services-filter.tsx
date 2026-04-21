'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  _count: {
    services: number;
  };
  subcategories: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
  }>;
}

const serviceTypes = [
  { value: 'DIGITAL', labelEn: 'Digital', labelAr: 'رقمي' },
  { value: 'AI', labelEn: 'AI', labelAr: 'ذكاء اصطناعي' },
  { value: 'MARKETING', labelEn: 'Marketing', labelAr: 'تسويق' },
  { value: 'CONSULTING', labelEn: 'Consulting', labelAr: 'استشارات' },
  { value: 'BOOKING', labelEn: 'Booking', labelAr: 'حجز' },
  { value: 'SUBSCRIPTION', labelEn: 'Subscription', labelAr: 'اشتراك' },
  { value: 'CUSTOM', labelEn: 'Custom', labelAr: 'مخصص' },
];

interface ServicesFilterProps {
  currentCategory?: string;
  currentType?: string;
  locale: string;
}

export function ServicesFilter({ currentCategory, currentType, locale }: ServicesFilterProps) {
  const t = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isArabic = locale === 'ar';

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/services/categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }

    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${locale}/services?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const clearFilters = () => {
    window.location.href = `/${locale}/services`;
  };

  const hasActiveFilters = currentCategory || currentType;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('common.filter')}</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <form onSubmit={handleSearch}>
          <Label className="text-sm font-medium mb-2 block">{t('common.search')}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <Separator />

        {/* Categories */}
        <div>
          <Label className="text-sm font-medium mb-3 block">{t('services.categories')}</Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/services?category=${category.slug}`}
              >
                <div
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors',
                    currentCategory === category.slug && 'bg-accent'
                  )}
                >
                  <span className="text-sm">
                    {isArabic ? category.nameAr : category.nameEn}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category._count.services}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Separator />

        {/* Service Types */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Service Type</Label>
          <div className="space-y-2">
            {serviceTypes.map((type) => (
              <Link
                key={type.value}
                href={`/${locale}/services?type=${type.value}${currentCategory ? `&category=${currentCategory}` : ''}`}
              >
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                  <Checkbox
                    checked={currentType === type.value}
                    className="pointer-events-none"
                  />
                  <span className="text-sm">
                    {isArabic ? type.labelAr : type.labelEn}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
