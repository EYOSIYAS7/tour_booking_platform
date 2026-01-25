import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class InitializePaymentDto {
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsEmail()
  email?: string; // Optional: will use user's email if not provided

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
