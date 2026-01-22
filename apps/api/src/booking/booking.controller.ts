// apps/api/src/booking/booking.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
@Controller('bookings') // Base route for all booking-related endpoints
export class BookingController {
  constructor(private bookingService: BookingService) {}

  // USER ROUTES

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createBooking(@GetUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(userId, dto);
  }

  @Get('my-bookings')
  getBookingsForUser(@GetUser('id') userId: string) {
    return this.bookingService.getBookingsForUser(userId);
  }

  @Get(':id')
  getBookingById(
    @GetUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.getBookingById(userId, bookingId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(
    @GetUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelBooking(userId, bookingId, dto);
  }

  // ADMIN ROUTES

  @UseGuards(AdminGuard)
  @Get('admin/all')
  adminGetAllBookings() {
    return this.bookingService.adminGetAllBookings();
  }

  @UseGuards(AdminGuard)
  @Get('admin/:id')
  adminGetBookingById(@Param('id') bookingId: string) {
    return this.bookingService.adminGetBookingById(bookingId);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:id/status')
  @HttpCode(HttpStatus.OK)
  adminUpdateBookingStatus(
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.adminUpdateBookingStatus(bookingId, dto);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:id/cancel')
  @HttpCode(HttpStatus.OK)
  adminCancelBooking(
    @Param('id') bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.adminCancelBooking(bookingId, dto);
  }
}
