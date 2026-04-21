import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { leadSchema } from '@/lib/validations';

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
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    const existingLead = await prisma.lead.findFirst({
      where: { email: validatedData.email },
    });

    if (existingLead) {
      await prisma.leadActivity.create({
        data: {
          leadId: existingLead.id,
          type: 'FORM_SUBMISSION',
          description: 'Lead submitted form again',
          metadata: validatedData,
        },
      });

      return NextResponse.json({ lead: existingLead });
    }

    const lead = await prisma.lead.create({
      data: {
        ...validatedData,
        status: 'NEW',
        activities: {
          create: {
            type: 'CREATED',
            description: 'Lead was created',
          },
        },
      },
      include: {
        activities: true,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
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
