import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

// we are expecting role data either USER or ADMIN
export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(Role) //
  role: Role; // this means role must be one of the values defined in the Role enum
}
