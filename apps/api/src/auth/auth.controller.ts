import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorator/get-user.decorator';
@Controller('auth') // Define the base route for this controller which is "/auth/...."
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetUser('id') userId: string) {
    // This method will be used to log out the user by invalidating the refresh token
    return this.authService.logout(userId);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetUser('sub') userId: string,
    @GetUser('refreshToken') refreshToken: string,
  ) {
    // This method will be used to refresh the access token using the refresh token
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: AuthDto) {
    //accepts the JSON body from the request and maps it to the AuthDto and performs validation
    // If the validation fails, it will throw an error automatically
    // If it passes, it will call the signup method in AuthService
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }
}
