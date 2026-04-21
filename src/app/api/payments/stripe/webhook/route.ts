import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent, formatAmountFromStripe } from '@/lib/stripe';
import { generateInvoiceNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const event = await constructWebhookEvent(body, signature);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentId: paymentIntent.id },
          include: {
            order: true,
            booking: true,
            customer: true,
          },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
            },
          });

          if (payment.orderId && payment.order) {
            await prisma.order.update({
              where: { id: payment.orderId },
              data: { status: 'CONFIRMED' },
            });

            await prisma.invoice.create({
              data: {
                invoiceNumber: generateInvoiceNumber(),
                customerId: payment.customerId,
                orderId: payment.orderId,
                subtotal: payment.order.subtotal,
                tax: payment.order.tax,
                total: payment.order.total,
                status: 'PAID',
                paidAt: new Date(),
                items: {
                  create: {
                    description: `Order ${payment.order.orderNumber}`,
                    quantity: 1,
                    unitPrice: payment.order.total,
                    total: payment.order.total,
                  },
                },
              },
            });

            await prisma.customerActivity.create({
              data: {
                customerId: payment.customerId,
                type: 'PAYMENT_MADE',
                title: 'Payment completed',
                description: `Payment for order ${payment.order.orderNumber}`,
                metadata: { paymentId: payment.id, orderId: payment.orderId },
              },
            });
          }

          if (payment.bookingId) {
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: 'CONFIRMED' },
            });

            await prisma.customerActivity.create({
              data: {
                customerId: payment.customerId,
                type: 'PAYMENT_MADE',
                title: 'Booking payment completed',
                description: `Payment for booking`,
                metadata: { paymentId: payment.id, bookingId: payment.bookingId },
              },
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'FAILED' },
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : 
                   subscription.status === 'past_due' ? 'PAST_DUE' :
                   subscription.status === 'canceled' ? 'CANCELLED' : 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        
        if (invoice.subscription) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string },
          });

          if (subscription) {
            await prisma.invoice.create({
              data: {
                invoiceNumber: generateInvoiceNumber(),
                customerId: subscription.customerId,
                subscriptionId: subscription.id,
                subtotal: formatAmountFromStripe(invoice.subtotal),
                tax: formatAmountFromStripe(invoice.tax || 0),
                total: formatAmountFromStripe(invoice.total),
                status: 'PAID',
                paidAt: new Date(),
              },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}
