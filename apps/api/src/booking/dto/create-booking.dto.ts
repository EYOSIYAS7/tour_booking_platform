import { IsNotEmpty, IsString } from 'class-validator';
//The purpose of a Data Transfer Object (DTO) is to define the structure of data being transferred between different parts of an application.
//DTOs are used to transfer data between different layers of the application, such as from the API endpoint to the service layer.

//defines the structure and type of data expected when creating a booking.
// In your case, it specifies that a tourId is required, and it must be a string.

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  tourId: string;
}
