import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { quoteSchema } from '@/lib/validations';
import { generateQuoteNumber } from '@/lib/utils';

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

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              slug: true,
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
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
    const validatedData = quoteSchema.parse(body);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        customerId: user.customer.id,
        serviceId: validatedData.serviceId,
        title: validatedData.title,
        description: validatedData.description,
        budget: validatedData.budget,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        attachments: validatedData.attachments || [],
        status: 'PENDING',
      },
      include: {
        service: true,
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: user.customer.id,
        type: 'QUOTE_REQUESTED',
        title: 'Quote requested',
        description: `Quote ${quote.quoteNumber} submitted for ${quote.service.nameEn}`,
        metadata: { quoteId: quote.id },
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error('Create quote error:', error);
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
