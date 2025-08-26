// apps/api/src/auth/strategy/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // a rule-book to check the access token is valid before sending the user info
  constructor(private prisma: PrismaService) {
    super({
      // the super configures the underlying passport-jwt strategy which is we extend
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: 'at-secret', // MUST be the same secret as in AuthService
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
    const { hash, hashRt, ...result } = user;
    return result;
  }
}
