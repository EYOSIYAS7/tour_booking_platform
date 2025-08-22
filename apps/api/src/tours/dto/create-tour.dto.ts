// apps/api/src/tours/dto/create-tour.dto.ts
import { IsString, IsNotEmpty, IsInt, IsDateString } from 'class-validator';

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
  @IsNotEmpty()
  price: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
