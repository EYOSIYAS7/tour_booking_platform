import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
@Controller('bookings') // Base route for all booking-related endpoints
export class BookingController {
  constructor(private bookingService: BookingService) {} // Inject the BookingService to handle business logic

  // Endpoint to create a new booking, accessible via POST /booking
  @Post()
  create_Booking(@GetUser('id') userId: string, @Body() dto: CreateBookingDto) {
    //Body decorator extracts the body of the request and maps it to the CreateBookingDto
    return this.bookingService.createBooking(userId, dto);
  }

  @Get('my-bookings')
  get_BookingForUser(@GetUser('id') userId: string) {
    return this.bookingService.getBookingsForUser(userId);
  }

  // -- ADMIN ROUTES --//
  @UseGuards(AuthGuard('jwt'), AdminGuard) // Ensure only authenticated admins can access this route
  @Get('admin/all')
  adminGetAllBookings() {
    return this.bookingService.adminGetAllBookings();
  }
}
