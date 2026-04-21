import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: params.id }, { orderNumber: params.id }],
        ...(user.role === 'CUSTOMER' && user.customer
          ? { customerId: user.customer.id }
          : {}),
      },
      include: {
        service: true,
        pricingTier: true,
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        addOns: {
          include: {
            addOn: true,
          },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        payment: true,
        invoice: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
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

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, deliverables, requirements } = body;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (user.role === 'CUSTOMER' && user.customer?.id !== order.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();

        await prisma.customer.update({
          where: { id: order.customerId },
          data: {
            lifetimeValue: { increment: Number(order.total) },
          },
        });

        await prisma.customerActivity.create({
          data: {
            customerId: order.customerId,
            type: 'ORDER_COMPLETED',
            title: 'Order completed',
            description: `Order ${order.orderNumber} was completed`,
            metadata: { orderId: order.id },
          },
        });
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }
    }

    if (deliverables) {
      updateData.deliverables = deliverables;
    }

    if (requirements && user.role === 'CUSTOMER') {
      updateData.requirements = requirements;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        service: true,
        pricingTier: true,
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
