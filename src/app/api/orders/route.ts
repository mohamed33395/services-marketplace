import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { orderSchema } from '@/lib/validations';
import { generateOrderNumber } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (user.role === 'CUSTOMER' && user.customer) {
      where.customerId = user.customer.id;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              slug: true,
              image: true,
            },
          },
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
          addOns: {
            include: {
              addOn: true,
            },
          },
          payment: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.customer) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = orderSchema.parse(body);

    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
      include: {
        pricingTiers: true,
        addOns: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    let subtotal = 0;
    let deliveryDays = 7;
    let revisions = 1;

    if (validatedData.pricingTierId) {
      const pricingTier = service.pricingTiers.find(
        (t) => t.id === validatedData.pricingTierId
      );
      if (pricingTier) {
        subtotal = Number(pricingTier.price);
        deliveryDays = pricingTier.deliveryDays;
        revisions = pricingTier.revisions;
      }
    }

    const addOnPrices: { addOnId: string; price: number }[] = [];
    if (validatedData.addOnIds && validatedData.addOnIds.length > 0) {
      for (const addOnId of validatedData.addOnIds) {
        const addOn = service.addOns.find((a) => a.id === addOnId);
        if (addOn) {
          subtotal += Number(addOn.price);
          deliveryDays += addOn.deliveryDays;
          addOnPrices.push({ addOnId, price: Number(addOn.price) });
        }
      }
    }

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: user.customer.id,
        serviceId: validatedData.serviceId,
        pricingTierId: validatedData.pricingTierId,
        requirements: validatedData.requirements,
        subtotal,
        tax,
        total,
        deliveryDate,
        revisionsLeft: revisions,
        status: 'PENDING',
        addOns: {
          create: addOnPrices.map((ap) => ({
            addOnId: ap.addOnId,
            price: ap.price,
            quantity: 1,
          })),
        },
      },
      include: {
        service: true,
        pricingTier: true,
        addOns: {
          include: {
            addOn: true,
          },
        },
      },
    });

    await prisma.customer.update({
      where: { id: user.customer.id },
      data: {
        totalOrders: { increment: 1 },
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: user.customer.id,
        type: 'ORDER_PLACED',
        title: 'Order placed',
        description: `Order ${order.orderNumber} was placed`,
        metadata: { orderId: order.id },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
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
