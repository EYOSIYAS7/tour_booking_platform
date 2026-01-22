import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @IsNotEmpty()
  @IsEnum(BookingStatus, {
    message:
      'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED, FAILED',
  })
  status: BookingStatus;
}
