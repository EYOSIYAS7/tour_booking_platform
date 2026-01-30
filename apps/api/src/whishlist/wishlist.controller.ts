// apps/api/src/wishlist/wishlist.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { WishlistService } from './wishlist.service';

@UseGuards(AuthGuard('jwt')) // All routes require authentication
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * Get user's wishlist
   * GET /wishlist
   */
  @Get()
  getUserWishlist(@GetUser('id') userId: string) {
    return this.wishlistService.getUserWishlist(userId);
  }

  /**
   * Get wishlist count
   * GET /wishlist/count
   */
  @Get('count')
  getWishlistCount(@GetUser('id') userId: string) {
    return this.wishlistService.getWishlistCount(userId);
  }

  /**
   * Add tour to wishlist
   * POST /wishlist/:tourId
   */
  @Post(':tourId')
  @HttpCode(HttpStatus.CREATED)
  addToWishlist(
    @GetUser('id') userId: string,
    @Param('tourId') tourId: string,
  ) {
    return this.wishlistService.addToWishlist(userId, tourId);
  }

  /**
   * Remove tour from wishlist
   * DELETE /wishlist/:tourId
   */
  @Delete(':tourId')
  @HttpCode(HttpStatus.OK)
  removeFromWishlist(
    @GetUser('id') userId: string,
    @Param('tourId') tourId: string,
  ) {
    return this.wishlistService.removeFromWishlist(userId, tourId);
  }

  /**
   * Check if tour is in wishlist
   * GET /wishlist/check/:tourId
   */
  @Get('check/:tourId')
  async isInWishlist(
    @GetUser('id') userId: string,
    @Param('tourId') tourId: string,
  ) {
    const isWishlisted = await this.wishlistService.isInWishlist(
      userId,
      tourId,
    );
    return {
      tourId,
      isWishlisted,
    };
  }

  /**
   * Batch check wishlist status for multiple tours
   * POST /wishlist/check-batch
   * Body: { tourIds: ["id1", "id2", ...] }
   */
  @Post('check-batch')
  @HttpCode(HttpStatus.OK)
  getWishlistStatus(
    @GetUser('id') userId: string,
    @Body('tourIds') tourIds: string[],
  ) {
    return this.wishlistService.getWishlistStatus(userId, tourIds);
  }

  /**
   * Clear entire wishlist
   * DELETE /wishlist
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  clearWishlist(@GetUser('id') userId: string) {
    return this.wishlistService.clearWishlist(userId);
  }
}

// PUBLIC ENDPOINT (No auth required)
@Controller('tours/popular/wishlisted')
export class WishlistPublicController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * Get most wishlisted tours (public)
   * GET /tours/popular/wishlisted?limit=10
   */
  @Get()
  getMostWishlisted(@Query('limit') limit?: string) {
    return this.wishlistService.getMostWishlisted(limit ? parseInt(limit) : 10);
  }
}
