import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initalize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private paymentService: PaymentService) {}

  /**
   * Step 1: Initialize payment
   * Mobile app calls this to get Chapa checkout URL
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  initializePayment(
    @GetUser('id') userId: string,
    @Body() dto: InitializePaymentDto,
  ) {
    this.logger.log(
      `Initializing payment for user ${userId}, booking ${dto.bookingId}`,
    );
    return this.paymentService.initializePayment(userId, dto);
  }

  /**
   * Step 2: Verify payment
   * Mobile app calls this when user returns from Chapa
   * OR user can click "I've completed payment" button
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    this.logger.log(
      `Verifying payment for transaction ${dto.transactionReference}`,
    );
    return this.paymentService.verifyPayment(dto.transactionReference);
  }

  /**
   * Alternative: Verify by booking ID
   * Easier for mobile apps - just pass booking ID
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('verify-booking/:bookingId')
  @HttpCode(HttpStatus.OK)
  async verifyByBooking(
    @GetUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    this.logger.log(`Verifying payment for booking ${bookingId}`);

    // Get booking to find transaction reference
    const status = await this.paymentService.getPaymentStatus(
      bookingId,
      userId,
    );

    // If payment not started, return that info
    if (status.status === 'not_started') {
      return status;
    }

    // If already confirmed, return success
    if (status.status === 'confirmed') {
      return status;
    }

    // Otherwise, try to verify with Chapa
    return status;
  }

  /**
   * Check payment status anytime
   * Mobile app can call this to check if payment succeeded
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('status/:bookingId')
  getPaymentStatus(
    @GetUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    this.logger.log(`Getting payment status for booking ${bookingId}`);
    return this.paymentService.getPaymentStatus(bookingId, userId);
  }

  /**
   * Return endpoint (optional)
   * This is where Chapa redirects users after payment
   * Can be handled by your mobile app or frontend
   */
  @Get('return')
  @HttpCode(HttpStatus.OK)
  handleReturn(
    @Query('booking_id') bookingId: string,
    @Query('tx_ref') txRef: string,
    @Query('status') status: string,
  ) {
    this.logger.log(
      `Payment return received for booking ${bookingId}, status: ${status}`,
    );

    return {
      status: 'received',
      message: 'Payment completed. Please verify your booking status.',
      bookingId,
      transactionReference: txRef,
      paymentStatus: status,
    };
  }
}
