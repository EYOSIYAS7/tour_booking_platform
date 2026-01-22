// apps/api/src/tours/dto/create-tour.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
  Min,
  Max,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(0, { message: 'Price must be a positive number' })
  @IsNotEmpty()
  price: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  endDate: string;

  @IsInt()
  @Min(1, { message: 'Maximum participants must be at least 1' })
  @Max(1000, { message: 'Maximum participants cannot exceed 1000' })
  @IsOptional()
  maxParticipants?: number; // Defaults to 50 if not provided
}
