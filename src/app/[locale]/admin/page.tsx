import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  HelpCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    todayRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalCustomers,
    newCustomersThisMonth,
    totalOrders,
    ordersThisMonth,
    pendingOrders,
    openTickets,
    pendingQuotes,
    recentOrders,
    recentCustomers,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: lastMonth, lt: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } }),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.quote.count({ where: { status: { in: ['PENDING', 'REVIEWING'] } } }),
    prisma.order.findMany({
      include: {
        service: { select: { nameEn: true, nameAr: true } },
        customer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.customer.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const monthRevenueValue = Number(monthRevenue._sum.amount || 0);
  const lastMonthRevenueValue = Number(lastMonthRevenue._sum.amount || 0);
  const revenueChange = lastMonthRevenueValue > 0
    ? ((monthRevenueValue - lastMonthRevenueValue) / lastMonthRevenueValue) * 100
    : 0;

  const isArabic = locale === 'ar';

  const stats = [
    {
      name: 'Total Revenue',
      value: formatCurrency(monthRevenueValue),
      change: revenueChange,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Total Customers',
      value: totalCustomers.toString(),
      subtext: `+${newCustomersThisMonth} this month`,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Total Orders',
      value: totalOrders.toString(),
      subtext: `${ordersThisMonth} this month`,
      icon: ShoppingBag,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      name: "Today's Revenue",
      value: formatCurrency(Number(todayRevenue._sum.amount || 0)),
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  const alerts = [
    { label: 'Pending Orders', count: pendingOrders, href: `/${locale}/admin/orders?status=PENDING`, color: 'bg-yellow-500' },
    { label: 'Open Tickets', count: openTickets, href: `/${locale}/admin/support?status=OPEN`, color: 'bg-red-500' },
    { label: 'Pending Quotes', count: pendingQuotes, href: `/${locale}/admin/quotes?status=PENDING`, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your marketplace performance
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/analytics`}>
            View Analytics
          </Link>
        </Button>
      </div>

      {/* Alerts */}
      {(pendingOrders > 0 || openTickets > 0 || pendingQuotes > 0) && (
        <div className="flex flex-wrap gap-4">
          {alerts.map((alert) => alert.count > 0 && (
            <Link key={alert.label} href={alert.href}>
              <Badge className={`${alert.color} text-white px-4 py-2 text-sm`}>
                {alert.count} {alert.label}
              </Badge>
            </Link>
          ))}
        </div>
      )}

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
              {stat.change !== undefined && (
                <p className={`text-xs flex items-center mt-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stat.change).toFixed(1)}% from last month
                </p>
              )}
              {stat.subtext && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/admin/orders`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {order.customer.user.firstName} {order.customer.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isArabic ? order.service.nameAr : order.service.nameEn}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(order.total))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>New Customers</CardTitle>
              <CardDescription>Recently registered customers</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/admin/customers`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {customer.user.firstName} {customer.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {customer.user.email}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(customer.user.createdAt, locale)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href={`/${locale}/admin/services/new`}>
                Add New Service
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/orders?status=PENDING`}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Process Orders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/support`}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Support Tickets
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/quotes`}>
                <FileText className="mr-2 h-4 w-4" />
                Review Quotes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
