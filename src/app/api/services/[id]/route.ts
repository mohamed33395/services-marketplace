import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serviceSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
        isActive: true,
      },
      include: {
        category: true,
        subcategory: true,
        pricingTiers: {
          where: { isActive: true },
          orderBy: { tier: 'asc' },
        },
        addOns: {
          where: { isActive: true },
        },
        packages: {
          where: { isActive: true },
        },
        bookingConfig: {
          include: {
            timeSlots: {
              where: { isActive: true },
            },
          },
        },
        subscriptionPlans: {
          where: { isActive: true },
        },
        reviews: {
          where: { isVisible: true },
          include: {
            order: {
              include: {
                customer: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
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
    const validatedData = serviceSchema.partial().parse(body);

    const service = await prisma.service.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        category: true,
        subcategory: true,
        pricingTiers: true,
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Update service error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.service.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
