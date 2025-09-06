import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { CreateReviewDto } from './dto/create-reviews-dto';
import { ReviewsService } from './reviews.service';

@UseGuards(AuthGuard('jwt'))
@Controller('tours/:tourId/reviews') // Nested route under tours
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  createReview(
    @GetUser('id') userId: string, // gets the userId 
    @Param('tourId') tourId: string, // gets the toutId from the url
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, tourId, dto);
  }
}
