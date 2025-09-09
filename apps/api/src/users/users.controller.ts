import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { User } from '@prisma/client';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { UsersService } from './users.service';

@Controller('users') // Define the base route for this controller which is "/users/...."
export class UsersController {
  constructor(private usersService: UsersService) {}
  @UseGuards(AuthGuard('jwt')) // uses the JWT strategy for validating the jwt token wether it is valid or not
  @Get('me') // Define the route for getting the current user
  getMe(@GetUser() user: User) {
    // Use the custom decorator to get the user from the request object
    // The user object is automatically populated by the JwtStrategy's validate method
    // and it will not include the password hash due to the destructuring in JwtStrategy
    return user;
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('all')
  getAllUsers() {
    return this.usersService.findAll();
  }
}
