import { useTranslations } from 'next-intl';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  HelpCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const user = await getCurrentUser();
  const t = useTranslations();

  if (!user?.customer) {
    return null;
  }

  const [recentOrders, recentBookings, activeSubscriptions, openTickets, stats] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: user.customer.id },
      include: {
        service: { select: { nameEn: true, nameAr: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.booking.findMany({
      where: {
        customerId: user.customer.id,
        date: { gte: new Date() },
      },
      include: {
        service: { select: { nameEn: true, nameAr: true } },
      },
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.subscription.count({
      where: { customerId: user.customer.id, status: 'ACTIVE' },
    }),
    prisma.supportTicket.count({
      where: { customerId: user.customer.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    prisma.order.aggregate({
      where: { customerId: user.customer.id, status: 'COMPLETED' },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const isArabic = locale === 'ar';

  const dashboardStats = [
    {
      title: t('dashboard.totalSpent'),
      value: formatCurrency(Number(stats._sum.total || 0)),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: t('dashboard.completedOrders'),
      value: stats._count.toString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      title: t('dashboard.upcomingBookings'),
      value: recentBookings.length.toString(),
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: t('dashboard.activeSubscriptions'),
      value: activeSubscriptions.toString(),
      icon: CreditCard,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          {t('dashboard.welcome')}, {user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
              <CardDescription>Your latest orders</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard/orders`}>
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isArabic ? order.service.nameAr : order.service.nameEn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.orderNumber} • {formatDate(order.createdAt, locale)}
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
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.upcomingBookings')}</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard/bookings`}>
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isArabic ? booking.service.nameAr : booking.service.nameEn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.date, locale)} • {booking.startTime}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get things done quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href={`/${locale}/services`}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Services
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/support`}>
                <HelpCircle className="mr-2 h-4 w-4" />
                {openTickets > 0 ? `${openTickets} Open Tickets` : 'Get Support'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
