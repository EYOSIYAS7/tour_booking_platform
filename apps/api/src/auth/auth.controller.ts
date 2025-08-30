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
import { Res, Response as ExpressResponse } from '@nestjs/common';
import type { Response } from 'express';

@Controller('auth') // Define the base route for this controller which is "/auth/...."
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('jwt')) // protects this route with JWT strategy by validating the access token
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // removes the auth token from the cookie
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
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
  // use @Res to set cookies in the response object and passthrough to allow Nest to still handle the response
  // inject the response object from express as a nest decorator
  async signup(
    @Body() dto: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signup(dto);
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
    }); // Set secure: true in production
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
    });
    return { message: 'Signup successful' };
  }

  // signup(@Body() dto: AuthDto) {
  //   //accepts the JSON body from the request and maps it to the AuthDto and performs validation
  //   // If the validation fails, it will throw an error automatically
  //   // If it passes, it will call the signup method in AuthService
  //   return this.authService.signup(dto);
  // }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() dto: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signin(dto);
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
    });
    return { message: 'Signin successful' };
  }
  // signin(@Body() dto: AuthDto) {
  //   return this.authService.signin(dto);
  // }
}
