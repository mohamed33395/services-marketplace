import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createOrder as createPayPalOrder, captureOrder } from '@/lib/paypal';

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
    const { orderId, bookingId, action } = body;

    if (action === 'create') {
      let totalAmount = 0;
      let description = '';
      let customId = '';

      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { service: true },
        });

        if (!order || order.customerId !== user.customer.id) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        totalAmount = Number(order.total);
        description = `Order ${order.orderNumber} - ${order.service.nameEn}`;
        customId = `order_${orderId}`;
      }

      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { service: true },
        });

        if (!booking || booking.customerId !== user.customer.id) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }

        totalAmount = Number(booking.price);
        description = `Booking - ${booking.service.nameEn}`;
        customId = `booking_${bookingId}`;
      }

      const paypalOrder = await createPayPalOrder(totalAmount, 'USD', description, customId);

      await prisma.payment.create({
        data: {
          customerId: user.customer.id,
          orderId,
          bookingId,
          amount: totalAmount,
          currency: 'USD',
          method: 'PAYPAL',
          status: 'PENDING',
          paypalPaymentId: paypalOrder.id,
        },
      });

      const approveLink = paypalOrder.links.find(link => link.rel === 'approve');

      return NextResponse.json({
        orderID: paypalOrder.id,
        approveUrl: approveLink?.href,
      });
    }

    if (action === 'capture') {
      const { paypalOrderId } = body;

      const captureResult = await captureOrder(paypalOrderId);

      const payment = await prisma.payment.findFirst({
        where: { paypalPaymentId: paypalOrderId },
        include: { order: true, booking: true },
      });

      if (payment && captureResult.status === 'COMPLETED') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
          },
        });

        if (payment.orderId) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' },
          });

          await prisma.customerActivity.create({
            data: {
              customerId: payment.customerId,
              type: 'PAYMENT_MADE',
              title: 'PayPal payment completed',
              description: `Payment for order ${payment.order?.orderNumber}`,
              metadata: { paymentId: payment.id },
            },
          });
        }

        if (payment.bookingId) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' },
          });
        }
      }

      return NextResponse.json({ success: true, captureResult });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PayPal payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
