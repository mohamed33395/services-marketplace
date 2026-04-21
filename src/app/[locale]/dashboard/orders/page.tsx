import { useTranslations } from 'next-intl';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Eye, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function OrdersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; page?: string };
}) {
  const user = await getCurrentUser();
  const t = useTranslations();

  if (!user?.customer) {
    return null;
  }

  const status = searchParams.status;
  const page = parseInt(searchParams.page || '1');
  const limit = 10;

  const where: Record<string, unknown> = {
    customerId: user.customer.id,
  };

  if (status && status !== 'all') {
    where.status = status;
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        service: {
          select: { nameEn: true, nameAr: true, slug: true, image: true },
        },
        pricingTier: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      where: { customerId: user.customer.id },
      _count: true,
    }),
  ]);

  const isArabic = locale === 'ar';
  const totalPages = Math.ceil(total / limit);

  const statusTabs = [
    { value: 'all', label: t('common.all'), count: total },
    { value: 'PENDING', label: 'Pending', count: statusCounts.find(s => s.status === 'PENDING')?._count || 0 },
    { value: 'CONFIRMED', label: 'Confirmed', count: statusCounts.find(s => s.status === 'CONFIRMED')?._count || 0 },
    { value: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.find(s => s.status === 'IN_PROGRESS')?._count || 0 },
    { value: 'DELIVERED', label: 'Delivered', count: statusCounts.find(s => s.status === 'DELIVERED')?._count || 0 },
    { value: 'COMPLETED', label: 'Completed', count: statusCounts.find(s => s.status === 'COMPLETED')?._count || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('orders.myOrders')}</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your orders
        </p>
      </div>

      <Tabs defaultValue={status || 'all'} className="w-full">
        <TabsList className="mb-4">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={`/${locale}/dashboard/orders?status=${tab.value}`}>
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={status || 'all'}>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t('orders.noOrders')}</p>
                <Button asChild className="mt-4">
                  <Link href={`/${locale}/services`}>{t('services.viewAll')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {isArabic ? order.service.nameAr : order.service.nameEn}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Order #{order.orderNumber}</p>
                          <p>
                            {order.pricingTier && (
                              <span className="capitalize">{order.pricingTier.tier.toLowerCase()} Package • </span>
                            )}
                            Placed on {formatDate(order.createdAt, locale)}
                          </p>
                          {order.deliveryDate && (
                            <p>Expected delivery: {formatDate(order.deliveryDate, locale)}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(order.total))}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/${locale}/dashboard/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              {t('orders.viewDetails')}
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/${locale}/dashboard/orders/${order.id}?tab=messages`}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Messages
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {[...Array(totalPages)].map((_, i) => (
                    <Link
                      key={i}
                      href={`/${locale}/dashboard/orders?status=${status || 'all'}&page=${i + 1}`}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
