import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    // Verify the tour exists before creating a booking
    const tour = await this.prisma.tour.findUnique({
      where: { id: dto.tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Create the booking, linking the user and tour
    return this.prisma.booking.create({
      data: {
        userId: userId,
        tourId: dto.tourId,
      },
    });
  }

  // Get all bookings for a specific user, fetch based on userId
  getBookingsForUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId: userId },
      include: {
        // Also fetch the details of the tour for each booking
        tour: true,
      },
    });
  }
}
