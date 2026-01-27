import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ToursModule } from './tours/tours.module';
import { BookingModule } from './booking/booking.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payment/payment.module';
import { EmailModule } from './email/email.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ToursModule,
    BookingModule,
    ReviewsModule,
    PaymentsModule,
    EmailModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
