//The purpose of a Data Transfer Object (DTO) is to define the structure of data being transferred between different parts of an application.
//DTOs are used to transfer data between different layers of the application, such as from the API endpoint to the service layer.

//defines the structure and type of data expected when creating a booking.
// In your case, it specifies that a tourId is required, and it must be a string.

import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  tourId: string;

  @IsInt()
  @Min(1, { message: 'Number of participants must be at least 1' })
  @Max(50, { message: 'Number of participants cannot exceed 50' })
  numberOfParticipants: number;
}
