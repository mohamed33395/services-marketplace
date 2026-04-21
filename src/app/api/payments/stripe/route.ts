import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createPaymentIntent } from '@/lib/stripe';

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
    const { orderId, bookingId, amount, currency = 'usd' } = body;

    if (!orderId && !bookingId) {
      return NextResponse.json(
        { error: 'Order ID or Booking ID is required' },
        { status: 400 }
      );
    }

    let totalAmount = amount;
    let metadata: Record<string, string> = {
      customerId: user.customer.id,
    };

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.customerId !== user.customer.id) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      totalAmount = Number(order.total);
      metadata.orderId = orderId;
      metadata.orderNumber = order.orderNumber;
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.customerId !== user.customer.id) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      totalAmount = Number(booking.price);
      metadata.bookingId = bookingId;
    }

    const paymentIntent = await createPaymentIntent(totalAmount, currency, metadata);

    const payment = await prisma.payment.create({
      data: {
        customerId: user.customer.id,
        orderId,
        bookingId,
        amount: totalAmount,
        currency: currency.toUpperCase(),
        method: 'STRIPE',
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
