// apps/api/src/payments/payments.service.ts
// VERSION WITH ENHANCED ERROR LOGGING

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { Chapa } from 'chapa-nodejs';
import { BookingStatus } from '@prisma/client';
import { InitializePaymentDto } from './dto/initalize-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private chapa: Chapa;
  private returnUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    const secretKey = this.configService.get<string>('CHAPA_SECRET_KEY');

    // Enhanced configuration logging
    this.logger.log('=== Chapa Configuration Debug ===');
    this.logger.log(`Secret Key exists: ${!!secretKey}`);
    this.logger.log(
      `Secret Key starts with CHASECK_TEST: ${secretKey?.startsWith('CHASECK_TEST')}`,
    );
    this.logger.log(
      `Secret Key starts with CHASECK_LIVE: ${secretKey?.startsWith('CHASECK_LIVE')}`,
    );
    this.logger.log(`Secret Key length: ${secretKey?.length || 0}`);

    if (secretKey) {
      this.logger.log(`Secret Key preview: ${secretKey.substring(0, 20)}...`);
    }

    if (!secretKey) {
      this.logger.error(
        '❌ CHAPA_SECRET_KEY is not defined in environment variables',
      );
      this.logger.error('Please add CHAPA_SECRET_KEY to your .env file');
      throw new Error(
        'CHAPA_SECRET_KEY is not defined in environment variables',
      );
    }

    if (
      !secretKey.startsWith('CHASECK_TEST') &&
      !secretKey.startsWith('CHASECK_LIVE')
    ) {
      this.logger.error('❌ CHAPA_SECRET_KEY appears to be invalid format');
      this.logger.error(
        'Expected format: CHASECK_TEST-xxxxxxxx or CHASECK_LIVE-xxxxxxxx',
      );
      this.logger.error(`Got: ${secretKey.substring(0, 20)}...`);
      throw new Error(
        'CHAPA_SECRET_KEY must start with CHASECK_TEST or CHASECK_LIVE',
      );
    }

    try {
      this.chapa = new Chapa({
        secretKey: secretKey,
      });
      this.logger.log('✅ Chapa client initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Chapa client', error);
      throw error;
    }

    this.returnUrl = this.configService.get<string>(
      'PAYMENT_RETURN_URL',
      'http://localhost:3000/payment/verify',
    );

    this.logger.log(`Return URL configured: ${this.returnUrl}`);
    this.logger.log('=== End Chapa Configuration ===');
    this.logger.log('✅ Payment service initialized (MVP mode - no webhooks)');
  }

  async initializePayment(userId: string, dto: InitializePaymentDto) {
    this.logger.log(
      `Initializing payment for user: ${userId}, booking: ${dto.bookingId}`,
    );

    // Fetch the booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        tour: true,
        user: true,
      },
    });

    if (!booking) {
      this.logger.error(`Booking not found: ${dto.bookingId}`);
      throw new NotFoundException('Booking not found');
    }

    this.logger.log(
      `Found booking: ${booking.id}, status: ${booking.status}, amount: ${booking.totalAmount}`,
    );

    // Verify ownership
    if (booking.userId !== userId) {
      this.logger.error(
        `User ${userId} trying to pay for booking owned by ${booking.userId}`,
      );
      throw new BadRequestException('You can only pay for your own bookings');
    }

    // Check if booking is in payable status
    if (booking.status === BookingStatus.CONFIRMED) {
      this.logger.error(`Booking ${booking.id} is already confirmed`);
      throw new BadRequestException('This booking has already been paid for');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      this.logger.error(`Booking ${booking.id} is cancelled`);
      throw new BadRequestException('Cannot pay for a cancelled booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      this.logger.error(`Booking ${booking.id} is completed`);
      throw new BadRequestException('Cannot pay for a completed booking');
    }

    // Generate unique transaction reference
    const txRef = `TXN-${booking.id}-${Date.now()}`;

    // Prepare payment data
    const amount = booking.totalAmount;
    const email = dto.email || booking.user.email;
    const firstName =
      dto.firstName || booking.user.name?.split(' ')[0] || 'Customer';
    const lastName = dto.lastName || booking.user.name?.split(' ')[1] || 'Name';

    this.logger.log('Payment initialization data:');
    this.logger.log(`  - TX Ref: ${txRef}`);
    this.logger.log(`  - Amount: ${amount} ETB`);
    this.logger.log(`  - Email: ${email}`);
    this.logger.log(`  - Name: ${firstName} ${lastName}`);
    this.logger.log(
      `  - Return URL: ${this.returnUrl}?booking_id=${booking.id}&tx_ref=${txRef}`,
    );

    try {
      // Initialize payment with Chapa
      this.logger.log('Calling Chapa API...');

      const response = await this.chapa.initialize({
        tx_ref: txRef,
        amount: amount.toString(),
        currency: 'ETB',
        email: email,
        first_name: firstName,
        last_name: lastName,
        return_url: `${this.returnUrl}?booking_id=${booking.id}&tx_ref=${txRef}`,
        // customization: {
        //   title: `Payment for ${booking.tour.name}`,
        //   description: `Tour booking for ${booking.numberOfParticipants} participant(s)`,
        // },
      });

      this.logger.log('Chapa API response received');
      this.logger.log(`Response status: ${response.status}`);

      if (response.status !== 'success') {
        this.logger.error('Chapa initialization failed - non-success status');
        this.logger.error('Full response:', JSON.stringify(response, null, 2));
        throw new InternalServerErrorException('Failed to initialize payment');
      }

      // Update booking with payment reference
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentReference: txRef,
        },
      });

      this.logger.log(
        `✅ Payment initialized successfully for booking ${booking.id}`,
      );

      if (!response.data) {
        this.logger.error('Chapa response missing data object');
        throw new InternalServerErrorException(
          'Invalid response from payment gateway',
        );
      }

      this.logger.log(`Checkout URL: ${response.data.checkout_url}`);

      return {
        status: 'success',
        message: 'Payment initialized successfully',
        data: {
          checkoutUrl: response.data.checkout_url,
          transactionReference: txRef,
          amount: amount,
          currency: 'ETB',
          bookingId: booking.id,
        },
      };
    } catch (error) {
      this.logger.error('❌ Error initializing payment');
      this.logger.error(`Error type: ${error.constructor.name}`);

      // Properly stringify the error message
      let errorMessage = 'Unknown error';
      try {
        if (typeof error.message === 'object') {
          errorMessage = JSON.stringify(error.message, null, 2);
        } else {
          errorMessage = String(error.message);
        }
      } catch (e) {
        errorMessage = 'Could not parse error message';
      }
      this.logger.error(`Error message: ${errorMessage}`);

      // Log the entire error object
      try {
        this.logger.error('Full error object:', JSON.stringify(error, null, 2));
      } catch (e) {
        this.logger.error('Could not stringify error object');
      }

      // Log more details about the error
      if (error.response) {
        this.logger.error('Chapa API Error Response:');
        this.logger.error(`  Status: ${error.response.status}`);
        this.logger.error(`  Status Text: ${error.response.statusText}`);
        try {
          this.logger.error(
            `  Data: ${JSON.stringify(error.response.data, null, 2)}`,
          );
        } catch (e) {
          this.logger.error('  Data: Could not stringify response data');
        }
      }

      if (error.request) {
        this.logger.error('Request details:');
        try {
          this.logger.error(`  URL: ${error.request.url || 'N/A'}`);
          this.logger.error(`  Method: ${error.request.method || 'N/A'}`);
        } catch (e) {
          this.logger.error('  Could not extract request details');
        }
      }

      // Stack trace
      if (error.stack) {
        this.logger.error('Stack trace:', error.stack);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to initialize payment: ${errorMessage}`,
      );
    }
  }

  async verifyPayment(transactionReference: string) {
    this.logger.log(
      `Verifying payment for transaction: ${transactionReference}`,
    );

    try {
      const response = await this.chapa.verify({
        tx_ref: transactionReference,
      });

      this.logger.log(`Verification response status: ${response.status}`);

      if (response.status !== 'success') {
        this.logger.warn(
          `Payment verification failed for ${transactionReference}`,
        );
        return {
          status: 'failed',
          message: 'Payment verification failed',
          data: response,
        };
      }

      const paymentData = response.data;
      this.logger.log(`Payment status from Chapa: ${paymentData.status}`);

      const booking = await this.prisma.booking.findFirst({
        where: { paymentReference: transactionReference },
        include: { tour: true, user: true },
      });

      if (!booking) {
        this.logger.error(
          `No booking found for transaction: ${transactionReference}`,
        );
        throw new NotFoundException('Booking not found for this transaction');
      }

      if (
        paymentData.status === 'success' &&
        booking.status !== BookingStatus.CONFIRMED
      ) {
        const updatedBooking = await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            paidAt: new Date(),
          },
          include: {
            tour: true,
            user: {
              select: { email: true, name: true },
            },
          },
        });

        this.logger.log(
          `✅ Booking ${booking.id} confirmed after successful payment`,
        );

        // SEND PAYMENT SUCCESS EMAIL
        try {
          await this.emailService.sendPaymentSuccess({
            to: updatedBooking.user.email,
            userName: updatedBooking.user.name || 'Customer',
            tourName: updatedBooking.tour.name,
            bookingId: updatedBooking.id,
            amount: updatedBooking.totalAmount,
            paidAt: updatedBooking.paidAt!,
            transactionRef: transactionReference,
          });
        } catch (error) {
          this.logger.error('Failed to send payment success email:', error);
          // Don't fail the payment confirmation if email fails
        }

        return {
          status: 'success',
          message: 'Payment successful! Your booking is confirmed.',
          data: {
            transactionReference: transactionReference,
            amount: paymentData.amount,
            currency: paymentData.currency,
            email: paymentData.email,
            paymentStatus: paymentData.status,
            paidAt: updatedBooking.paidAt,
            booking: {
              id: updatedBooking.id,
              status: updatedBooking.status,
              tourName: updatedBooking.tour.name,
              numberOfParticipants: updatedBooking.numberOfParticipants,
              totalAmount: updatedBooking.totalAmount,
            },
          },
        };
      } else if (paymentData.status === 'failed') {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.FAILED,
          },
        });

        this.logger.log(`Booking ${booking.id} marked as failed`);

        return {
          status: 'failed',
          message: 'Payment failed. Please try again.',
          data: {
            transactionReference: transactionReference,
            paymentStatus: paymentData.status,
            booking: {
              id: booking.id,
              status: BookingStatus.FAILED,
            },
          },
        };
      } else {
        return {
          status: 'pending',
          message:
            'Payment is still being processed. Please check again shortly.',
          data: {
            transactionReference: transactionReference,
            paymentStatus: paymentData.status,
            booking: {
              id: booking.id,
              status: booking.status,
            },
          },
        };
      }
    } catch (error) {
      this.logger.error('Error verifying payment', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  async getPaymentStatus(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: {
          select: { name: true, location: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException(
        'You can only check your own booking status',
      );
    }

    if (!booking.paymentReference) {
      return {
        status: 'not_started',
        message: 'Payment has not been initialized for this booking',
        booking: {
          id: booking.id,
          status: booking.status,
          totalAmount: booking.totalAmount,
          tourName: booking.tour.name,
        },
      };
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return {
        status: 'confirmed',
        message: 'Booking is confirmed and paid',
        booking: {
          id: booking.id,
          status: booking.status,
          totalAmount: booking.totalAmount,
          tourName: booking.tour.name,
          paidAt: booking.paidAt,
        },
      };
    }

    try {
      const verification = await this.verifyPayment(booking.paymentReference);
      return verification;
    } catch (error) {
      this.logger.error(
        `Error getting payment status for booking ${bookingId}`,
        error,
      );

      return {
        status: booking.status.toLowerCase(),
        message: `Booking status: ${booking.status}`,
        booking: {
          id: booking.id,
          status: booking.status,
          totalAmount: booking.totalAmount,
          tourName: booking.tour.name,
        },
      };
    }
  }
}
