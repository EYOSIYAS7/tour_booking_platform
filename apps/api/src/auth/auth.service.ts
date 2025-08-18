import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: AuthDto) {
    // Check if user already exists
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (userExists) {
      throw new ForbiddenException('A user with this email already exists');
    }

    // Hash the password
    const hash = await bcrypt.hash(dto.password, 10);

    // Save the new user to the database
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });

    // Return JWT tokens an access token so the user can authenticate without needing to log in again
    // immediately after signing up
    return this.signTokens(newUser.id, newUser.email);
  }

  async signin(dto: AuthDto) {
    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    // Compare passwords
    const passwordMatches = await bcrypt.compare(dto.password, user.hash);
    if (!passwordMatches) {
      throw new ForbiddenException('Invalid credentials');
    }

    // Return JWT tokens an access token so the user can authenticate
    // without needing to log in again immediately after signing in
    return this.signTokens(user.id, user.email);
  }

  // Helper function to sign JWT tokens
  async signTokens(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email };
    const secret = 'super-secret'; // IMPORTANT: Use a real secret from environment variables in production

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return { access_token: token };
  }
}
