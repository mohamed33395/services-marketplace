import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Edit, Eye, Search, Star, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import Image from 'next/image';

export default async function AdminServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { search?: string; category?: string; page?: string };
}) {
  const t = useTranslations();
  const search = searchParams.search;
  const category = searchParams.category;
  const page = parseInt(searchParams.page || '1');
  const limit = 10;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { nameEn: { contains: search, mode: 'insensitive' } },
      { nameAr: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  const [services, total, categories] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        category: true,
        pricingTiers: {
          where: { isActive: true },
          orderBy: { tier: 'asc' },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.service.count({ where }),
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  const isArabic = locale === 'ar';
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.services')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your service catalog
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/services/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search services..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="category"
              defaultValue={category}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {isArabic ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter((s) => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter((s) => s.isFeatured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>{total} services found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => {
              const lowestPrice = service.pricingTiers.length > 0
                ? Math.min(...service.pricingTiers.map((t) => Number(t.price)))
                : null;

              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                      {service.image ? (
                        <Image
                          src={service.image}
                          alt={isArabic ? service.nameAr : service.nameEn}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                          {(isArabic ? service.nameAr : service.nameEn)[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {isArabic ? service.nameAr : service.nameEn}
                        </h3>
                        {service.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {!service.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {isArabic ? service.category.nameAr : service.category.nameEn}
                        </span>
                        <span className="capitalize">{service.type.toLowerCase()}</span>
                        {service.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {Number(service.averageRating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {lowestPrice !== null ? `From ${formatCurrency(lowestPrice)}` : 'Custom pricing'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {service._count.orders} orders • {service._count.reviews} reviews
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/services/${service.slug}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/admin/services/${service.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(totalPages)].map((_, i) => (
                <Link
                  key={i}
                  href={`/${locale}/admin/services?page=${i + 1}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
