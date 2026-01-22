import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Cancellation reason cannot exceed 500 characters',
  })
  reason?: string;
}
