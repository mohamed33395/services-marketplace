import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

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
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const [
      totalRevenue,
      previousRevenue,
      totalOrders,
      previousOrders,
      totalCustomers,
      previousCustomers,
      totalBookings,
      activeSubscriptions,
      recentOrders,
      topServices,
      revenueByDay,
      ordersByStatus,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: previousPeriodStart, lt: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: previousPeriodStart, lt: startDate } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: previousPeriodStart, lt: startDate } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          service: {
            select: { nameEn: true, nameAr: true },
          },
          customer: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ['serviceId'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        _sum: { total: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as count
        FROM payments
        WHERE status = 'COMPLETED' AND paid_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const topServicesWithDetails = await Promise.all(
      topServices.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { nameEn: true, nameAr: true, slug: true },
        });
        return {
          ...item,
          service,
        };
      })
    );

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

    return NextResponse.json({
      overview: {
        totalRevenue: currentRevenueValue,
        revenueChange,
        totalOrders,
        ordersChange,
        totalCustomers,
        customersChange,
        totalBookings,
        activeSubscriptions,
      },
      recentOrders,
      topServices: topServicesWithDetails,
      revenueByDay,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
