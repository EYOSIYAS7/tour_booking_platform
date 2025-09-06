import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-reviews-dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, tourId: string, dto: CreateReviewDto) {
    // Step 1: Authorization Check - Verify the user has booked this tour.
    const booking = await this.prisma.booking.findFirst({
      where: { userId: userId, tourId: tourId },
    });

    if (!booking) {
      throw new ForbiddenException(
        'You can only review tours you have booked.',
      );
    }

    // Step 2: Attempt to create the review.
    try {
      const review = await this.prisma.review.create({
        data: {
          userId: userId,
          tourId: tourId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
      return review;
    } catch (error) {
      // Step 3: Gracefully handle the unique constraint violation.
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already submitted a review for this tour.',
        );
      }
      throw error;
    }
  }
}
