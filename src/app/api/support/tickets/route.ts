import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { supportTicketSchema } from '@/lib/validations';
import { generateTicketNumber } from '@/lib/utils';

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
    const priority = searchParams.get('priority');
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

    if (priority) {
      where.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
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
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
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
    const validatedData = supportTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: user.customer.id,
        subject: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority,
        category: validatedData.category,
        status: 'OPEN',
        messages: {
          create: {
            senderId: user.id,
            senderType: 'CUSTOMER',
            content: validatedData.description,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: user.customer.id,
        type: 'TICKET_OPENED',
        title: 'Support ticket opened',
        description: `Ticket ${ticket.ticketNumber}: ${validatedData.subject}`,
        metadata: { ticketId: ticket.id },
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
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
