import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            service: {
              select: {
                nameEn: true,
                nameAr: true,
              },
            },
          },
        },
        bookings: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            service: {
              select: {
                nameEn: true,
                nameAr: true,
              },
            },
          },
        },
        subscriptions: {
          include: {
            plan: true,
          },
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            orders: true,
            bookings: true,
            subscriptions: true,
            supportTickets: true,
            quotes: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyName, website, industry, address, city, country, tags } = body;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        companyName,
        website,
        industry,
        address,
        city,
        country,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (tags && Array.isArray(tags)) {
      await prisma.customerTag.deleteMany({
        where: { customerId: params.id },
      });

      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName },
          });
        }

        await prisma.customerTag.create({
          data: {
            customerId: params.id,
            tagId: tag.id,
          },
        });
      }
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
