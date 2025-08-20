// apps/api/src/auth/strategy/rt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'rt-secret', // Use the refresh token secret
      passReqToCallback: true, // We need the request object to get the token
    });
  }

  validate(req: Request, payload: any) {
    const authHeader = req.get('authorization');
    const refreshToken = authHeader
      ? authHeader.replace('Bearer', '').trim()
      : null;
    return { ...payload, refreshToken };
  }
}
