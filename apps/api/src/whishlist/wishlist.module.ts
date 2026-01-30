import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import {
  WishlistController,
  WishlistPublicController,
} from './wishlist.controller';

@Module({
  controllers: [WishlistController, WishlistPublicController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
