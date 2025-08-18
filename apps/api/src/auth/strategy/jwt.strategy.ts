// apps/api/src/auth/strategy/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'super-secret', // MUST be the same secret as in AuthService
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    // The password hash should not be returned

    // if (user && 'hash' in user) {
    //   delete (user as { hash?: string }).hash;
    // }

    if (!user) {
      return null;
    }
    // This is the fix: Destructure the object to exclude the 'hash' property
    const { hash, ...result } = user;
    return result;
  }
}
