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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      monthOrders,
      monthRevenue,
      totalCustomers,
      activeServices,
      pendingOrders,
      openTickets,
      pendingQuotes,
      upcomingBookings,
      recentActivities,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: today },
        },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.customer.count(),
      prisma.service.count({
        where: { isActive: true },
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.quote.count({
        where: { status: { in: ['PENDING', 'REVIEWING'] } },
      }),
      prisma.booking.findMany({
        where: {
          date: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: {
          service: {
            select: { nameEn: true, nameAr: true },
          },
          customer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      prisma.customerActivity.findMany({
        include: {
          customer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        todayOrders,
        todayRevenue: Number(todayRevenue._sum.amount || 0),
        monthOrders,
        monthRevenue: Number(monthRevenue._sum.amount || 0),
        totalCustomers,
        activeServices,
        pendingOrders,
        openTickets,
        pendingQuotes,
      },
      upcomingBookings,
      recentActivities,
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
