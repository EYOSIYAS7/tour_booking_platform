// apps/api/src/tours/dto/create-tour.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
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
}
