import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { bookingSchema } from '@/lib/validations';

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
    const date = searchParams.get('date');
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

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
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
          timeSlot: true,
          payment: true,
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
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
    const validatedData = bookingSchema.parse(body);

    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
      include: {
        bookingConfig: {
          include: {
            timeSlots: true,
          },
        },
      },
    });

    if (!service || !service.bookingConfig) {
      return NextResponse.json(
        { error: 'Service not found or does not support booking' },
        { status: 404 }
      );
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        serviceId: validatedData.serviceId,
        date: new Date(validatedData.date),
        startTime: validatedData.startTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: user.customer.id,
        serviceId: validatedData.serviceId,
        timeSlotId: validatedData.timeSlotId,
        date: new Date(validatedData.date),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        notes: validatedData.notes,
        price: service.bookingConfig.price,
        status: service.bookingConfig.requiresApproval ? 'PENDING' : 'CONFIRMED',
      },
      include: {
        service: true,
        timeSlot: true,
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: user.customer.id,
        type: 'BOOKING_MADE',
        title: 'Booking made',
        description: `Booking for ${service.nameEn} on ${validatedData.date}`,
        metadata: { bookingId: booking.id },
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
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
