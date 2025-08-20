import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { RtStrategy } from './strategy/rt.strategy';
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RtStrategy],
})
export class AuthModule {}
