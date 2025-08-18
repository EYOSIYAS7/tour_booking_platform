import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
}
