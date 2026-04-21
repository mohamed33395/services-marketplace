import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Eye, Download } from 'lucide-react';
import Link from 'next/link';

export default async function AdminOrdersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; page?: string };
}) {
  const t = useTranslations();
  const status = searchParams.status;
  const page = parseInt(searchParams.page || '1');
  const limit = 10;

  const where: Record<string, unknown> = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        service: {
          select: { nameEn: true, nameAr: true, slug: true },
        },
        pricingTier: true,
        customer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const isArabic = locale === 'ar';
  const totalPages = Math.ceil(total / limit);

  const statusTabs = [
    { value: 'all', label: 'All', count: total },
    { value: 'PENDING', label: 'Pending', count: statusCounts.find(s => s.status === 'PENDING')?._count || 0 },
    { value: 'CONFIRMED', label: 'Confirmed', count: statusCounts.find(s => s.status === 'CONFIRMED')?._count || 0 },
    { value: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.find(s => s.status === 'IN_PROGRESS')?._count || 0 },
    { value: 'DELIVERED', label: 'Delivered', count: statusCounts.find(s => s.status === 'DELIVERED')?._count || 0 },
    { value: 'COMPLETED', label: 'Completed', count: statusCounts.find(s => s.status === 'COMPLETED')?._count || 0 },
    { value: 'CANCELLED', label: 'Cancelled', count: statusCounts.find(s => s.status === 'CANCELLED')?._count || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.orders')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage and process customer orders
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Tabs defaultValue={status || 'all'} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={`/${locale}/admin/orders?status=${tab.value}`}>
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
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>{total} orders found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Order</th>
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Service</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <span className="font-mono text-sm">{order.orderNumber}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {order.customer.user.firstName} {order.customer.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer.user.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">
                            {isArabic ? order.service.nameAr : order.service.nameEn}
                          </p>
                          {order.pricingTier && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {order.pricingTier.tier.toLowerCase()}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">
                            {formatCurrency(Number(order.total))}
                          </p>
                          {order.payment && (
                            <Badge
                              variant={order.payment.status === 'COMPLETED' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {order.payment.status}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{formatDate(order.createdAt, locale)}</p>
                          {order.deliveryDate && (
                            <p className="text-xs text-muted-foreground">
                              Due: {formatDate(order.deliveryDate, locale)}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/${locale}/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {[...Array(totalPages)].map((_, i) => (
                    <Link
                      key={i}
                      href={`/${locale}/admin/orders?status=${status || 'all'}&page=${i + 1}`}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
