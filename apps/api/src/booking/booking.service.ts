// apps/api/src/booking/booking.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    // Verify the tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: dto.tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check if tour is in the past
    if (new Date(tour.startDate) < new Date()) {
      throw new BadRequestException(
        'Cannot book a tour that has already started',
      );
    }

    // Check available capacity
    const availableSlots = tour.maxParticipants - tour.bookedSlots;
    if (availableSlots < dto.numberOfParticipants) {
      throw new BadRequestException(
        `Not enough available slots. Only ${availableSlots} slots remaining.`,
      );
    }

    // Check for existing pending/confirmed booking for this user and tour
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        tourId: dto.tourId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (existingBooking) {
      throw new BadRequestException(
        'You already have an active booking for this tour',
      );
    }

    // Calculate total amount
    const totalAmount = tour.price * dto.numberOfParticipants;

    // Create the booking using a transaction to ensure data consistency
    const booking = await this.prisma.$transaction(async (tx) => {
      // Reserve the slots by incrementing bookedSlots
      await tx.tour.update({
        where: { id: dto.tourId },
        data: { bookedSlots: { increment: dto.numberOfParticipants } },
      });

      // Create the booking
      return tx.booking.create({
        data: {
          userId,
          tourId: dto.tourId,
          numberOfParticipants: dto.numberOfParticipants,
          totalAmount,
          status: BookingStatus.PENDING,
        },
        include: {
          tour: {
            select: {
              name: true,
              location: true,
              startDate: true,
              endDate: true,
              price: true,
            },
          },
        },
      });
    });

    return booking;
  }

  async getBookingsForUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tour: {
          select: {
            id: true,
            name: true,
            location: true,
            startDate: true,
            endDate: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Users can only view their own bookings (admins handled separately)
    if (booking.userId !== userId) {
      throw new ForbiddenException('You can only view your own bookings');
    }

    return booking;
  }

  async cancelBooking(
    userId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check ownership
    if (booking.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    // Check if already cancelled or completed
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // Check if tour has already started
    if (new Date(booking.tour.startDate) < new Date()) {
      throw new BadRequestException(
        'Cannot cancel a booking for a tour that has already started',
      );
    }

    // Cancel the booking and release the slots
    const cancelledBooking = await this.prisma.$transaction(async (tx) => {
      // Release the booked slots
      await tx.tour.update({
        where: { id: booking.tourId },
        data: { bookedSlots: { decrement: booking.numberOfParticipants } },
      });

      // Update the booking status
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
        include: { tour: true },
      });
    });

    return cancelledBooking;
  }

  // --ADMIN LOGIC--

  async adminGetAllBookings() {
    return this.prisma.booking.findMany({
      orderBy: { bookingDate: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        tour: {
          select: { id: true, name: true, location: true, startDate: true },
        },
      },
    });
  }

  async adminGetBookingById(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: true,
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async adminUpdateBookingStatus(
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Prevent status changes for already completed bookings
    if (
      booking.status === BookingStatus.COMPLETED &&
      dto.status !== BookingStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot modify a completed booking');
    }

    // Handle slot management when changing to/from CANCELLED
    let updatedBooking;

    if (
      dto.status === BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.CANCELLED
    ) {
      // Cancelling: release slots
      updatedBooking = await this.prisma.$transaction(async (tx) => {
        await tx.tour.update({
          where: { id: booking.tourId },
          data: { bookedSlots: { decrement: booking.numberOfParticipants } },
        });

        return tx.booking.update({
          where: { id: bookingId },
          data: {
            status: dto.status,
            cancelledAt: new Date(),
            cancellationReason: 'Cancelled by admin',
          },
        });
      });
    } else if (
      booking.status === BookingStatus.CANCELLED &&
      dto.status !== BookingStatus.CANCELLED
    ) {
      // Reactivating: reserve slots again
      const availableSlots =
        booking.tour.maxParticipants - booking.tour.bookedSlots;
      if (availableSlots < booking.numberOfParticipants) {
        throw new BadRequestException(
          `Cannot reactivate booking. Not enough available slots. Only ${availableSlots} slots remaining.`,
        );
      }

      updatedBooking = await this.prisma.$transaction(async (tx) => {
        await tx.tour.update({
          where: { id: booking.tourId },
          data: { bookedSlots: { increment: booking.numberOfParticipants } },
        });

        return tx.booking.update({
          where: { id: bookingId },
          data: {
            status: dto.status,
            cancelledAt: null,
            cancellationReason: null,
          },
        });
      });
    } else {
      // Simple status update without slot changes
      updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: dto.status },
      });
    }

    return updatedBooking;
  }

  async adminCancelBooking(bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    const cancelledBooking = await this.prisma.$transaction(async (tx) => {
      await tx.tour.update({
        where: { id: booking.tourId },
        data: { bookedSlots: { decrement: booking.numberOfParticipants } },
      });

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason || 'Cancelled by admin',
        },
        include: { tour: true, user: { select: { email: true, name: true } } },
      });
    });

    return cancelledBooking;
  }
}
