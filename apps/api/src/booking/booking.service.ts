// apps/api/src/booking/booking.service.ts
// ADD EMAIL SERVICE INTEGRATION

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // IMPORT THIS
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService, // INJECT EMAIL SERVICE
  ) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: dto.tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    if (new Date(tour.startDate) < new Date()) {
      throw new BadRequestException(
        'Cannot book a tour that has already started',
      );
    }

    const availableSlots = tour.maxParticipants - tour.bookedSlots;
    if (availableSlots < dto.numberOfParticipants) {
      throw new BadRequestException(
        `Not enough available slots. Only ${availableSlots} slots remaining.`,
      );
    }

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

    const totalAmount = tour.price * dto.numberOfParticipants;

    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.tour.update({
        where: { id: dto.tourId },
        data: { bookedSlots: { increment: dto.numberOfParticipants } },
      });

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
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    });

    // SEND BOOKING CONFIRMATION EMAIL
    try {
      await this.emailService.sendBookingConfirmation({
        to: booking.user.email,
        userName: booking.user.name || 'Customer',
        tourName: booking.tour.name,
        bookingId: booking.id,
        numberOfParticipants: booking.numberOfParticipants,
        totalAmount: booking.totalAmount,
        bookingDate: booking.bookingDate,
        tourStartDate: booking.tour.startDate,
        tourEndDate: booking.tour.endDate,
      });
    } catch (error) {
      // Log but don't fail the booking if email fails
      console.error('Failed to send booking confirmation email:', error);
    }

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

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only view your own bookings');
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
      include: {
        tour: true,
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    if (new Date(booking.tour.startDate) < new Date()) {
      throw new BadRequestException(
        'Cannot cancel a booking for a tour that has already started',
      );
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
          cancellationReason: dto.reason,
        },
        include: { tour: true },
      });
    });

    // SEND CANCELLATION EMAIL
    try {
      await this.emailService.sendBookingCancellation({
        to: booking.user.email,
        userName: booking.user.name || 'Customer',
        tourName: booking.tour.name,
        bookingId: booking.id,
        reason: dto.reason,
        cancelledAt: cancelledBooking.cancelledAt!,
      });
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }

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

    if (
      booking.status === BookingStatus.COMPLETED &&
      dto.status !== BookingStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot modify a completed booking');
    }

    let updatedBooking;

    if (
      dto.status === BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.CANCELLED
    ) {
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
      include: {
        tour: true,
        user: {
          select: { email: true, name: true },
        },
      },
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

    // SEND CANCELLATION EMAIL
    try {
      await this.emailService.sendBookingCancellation({
        to: booking.user.email,
        userName: booking.user.name || 'Customer',
        tourName: booking.tour.name,
        bookingId: booking.id,
        reason: dto.reason || 'Cancelled by administrator',
        cancelledAt: cancelledBooking.cancelledAt!,
      });
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }

    return cancelledBooking;
  }
}
