import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default async function AdminAnalyticsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { period?: string };
}) {
  const t = useTranslations();
  const period = searchParams.period || '30d';

  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  const previousPeriodStart = new Date(startDate);
  const daysDiff = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);

  const [
    totalRevenue,
    previousRevenue,
    totalOrders,
    previousOrders,
    totalCustomers,
    previousCustomers,
    totalBookings,
    previousBookings,
    topServices,
    ordersByStatus,
    revenueByService,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: previousPeriodStart, lt: startDate } },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: startDate } } }),
    prisma.order.count({ where: { createdAt: { gte: previousPeriodStart, lt: startDate } } }),
    prisma.customer.count({ where: { createdAt: { gte: startDate } } }),
    prisma.customer.count({ where: { createdAt: { gte: previousPeriodStart, lt: startDate } } }),
    prisma.booking.count({ where: { createdAt: { gte: startDate } } }),
    prisma.booking.count({ where: { createdAt: { gte: previousPeriodStart, lt: startDate } } }),
    prisma.order.groupBy({
      by: ['serviceId'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['serviceId'],
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  const services = await prisma.service.findMany({
    where: { id: { in: topServices.map((s) => s.serviceId) } },
    select: { id: true, nameEn: true, nameAr: true },
  });

  const revenueServices = await prisma.service.findMany({
    where: { id: { in: revenueByService.map((s) => s.serviceId) } },
    select: { id: true, nameEn: true, nameAr: true },
  });

  const currentRevenueValue = Number(totalRevenue._sum.amount || 0);
  const previousRevenueValue = Number(previousRevenue._sum.amount || 0);
  const revenueChange = previousRevenueValue > 0
    ? ((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100
    : 0;

  const ordersChange = previousOrders > 0
    ? ((totalOrders - previousOrders) / previousOrders) * 100
    : 0;

  const customersChange = previousCustomers > 0
    ? ((totalCustomers - previousCustomers) / previousCustomers) * 100
    : 0;

  const bookingsChange = previousBookings > 0
    ? ((totalBookings - previousBookings) / previousBookings) * 100
    : 0;

  const isArabic = locale === 'ar';

  const stats = [
    {
      name: 'Total Revenue',
      value: formatCurrency(currentRevenueValue),
      change: revenueChange,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Total Orders',
      value: totalOrders.toString(),
      change: ordersChange,
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'New Customers',
      value: totalCustomers.toString(),
      change: customersChange,
      icon: Users,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      name: 'Total Bookings',
      value: totalBookings.toString(),
      change: bookingsChange,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.analytics')}</h1>
          <p className="text-muted-foreground mt-1">
            Track your marketplace performance
          </p>
        </div>
      </div>

      {/* Period Tabs */}
      <Tabs defaultValue={period} className="w-full">
        <TabsList>
          <TabsTrigger value="7d" asChild>
            <a href={`/${locale}/admin/analytics?period=7d`}>Last 7 days</a>
          </TabsTrigger>
          <TabsTrigger value="30d" asChild>
            <a href={`/${locale}/admin/analytics?period=30d`}>Last 30 days</a>
          </TabsTrigger>
          <TabsTrigger value="90d" asChild>
            <a href={`/${locale}/admin/analytics?period=90d`}>Last 90 days</a>
          </TabsTrigger>
          <TabsTrigger value="1y" asChild>
            <a href={`/${locale}/admin/analytics?period=1y`}>Last year</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center mt-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(stat.change).toFixed(1)}% vs previous period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Services by Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Top Services by Orders</CardTitle>
            <CardDescription>Most ordered services in this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((item, index) => {
                const service = services.find((s) => s.id === item.serviceId);
                if (!service) return null;
                return (
                  <div key={item.serviceId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">
                        {isArabic ? service.nameAr : service.nameEn}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item._count.id} orders</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(item._sum.total || 0))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersByStatus.map((item) => {
                const percentage = totalOrders > 0 ? (item._count / totalOrders) * 100 : 0;
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {item.status.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item._count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Top performing services by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByService.map((item) => {
                const service = revenueServices.find((s) => s.id === item.serviceId);
                if (!service) return null;
                const percentage = currentRevenueValue > 0
                  ? (Number(item._sum.total || 0) / currentRevenueValue) * 100
                  : 0;
                return (
                  <div key={item.serviceId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {isArabic ? service.nameAr : service.nameEn}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Number(item._sum.total || 0))}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
