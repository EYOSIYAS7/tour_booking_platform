// apps/api/src/wishlist/wishlist.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a tour to user's wishlist
   */
  async addToWishlist(userId: string, tourId: string) {
    // Check if tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: {
        id: true,
        name: true,
        location: true,
        price: true,
        imageUrl: true,
      },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID "${tourId}" not found`);
    }

    // Check if already in wishlist
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_tourId: {
          userId,
          tourId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Tour is already in your wishlist');
    }

    // Add to wishlist
    const wishlistItem = await this.prisma.wishlist.create({
      data: {
        userId,
        tourId,
      },
      include: {
        tour: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            imageUrl: true,
            startDate: true,
            endDate: true,
            maxParticipants: true,
            bookedSlots: true,
          },
        },
      },
    });

    return {
      message: 'Tour added to wishlist successfully',
      wishlistItem,
    };
  }

  /**
   * Remove a tour from user's wishlist
   */
  async removeFromWishlist(userId: string, tourId: string) {
    // Check if tour is in wishlist
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_tourId: {
          userId,
          tourId,
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Tour not found in your wishlist');
    }

    // Remove from wishlist
    await this.prisma.wishlist.delete({
      where: {
        id: wishlistItem.id,
      },
    });

    return {
      message: 'Tour removed from wishlist successfully',
    };
  }

  /**
   * Get user's entire wishlist
   */
  async getUserWishlist(userId: string) {
    const wishlistItems = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tour: {
          include: {
            _count: {
              select: { review: true, bookings: true },
            },
            review: {
              select: { rating: true },
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    icon: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate ratings and format response
    const formattedWishlist = wishlistItems.map((item) => {
      const tour = item.tour;
      const totalRating = tour.review.reduce(
        (acc, review) => acc + review.rating,
        0,
      );
      const reviewCount = tour._count.review;
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const availableSlots = tour.maxParticipants - tour.bookedSlots;

      const { review, _count, ...tourData } = tour;

      return {
        id: item.id,
        addedAt: item.createdAt,
        tour: {
          ...tourData,
          reviewCount,
          avgRating: parseFloat(avgRating.toFixed(1)),
          availableSlots,
          isAvailable: availableSlots > 0,
        },
      };
    });

    return {
      wishlist: formattedWishlist,
      count: formattedWishlist.length,
    };
  }

  /**
   * Check if a tour is in user's wishlist
   */
  async isInWishlist(userId: string, tourId: string): Promise<boolean> {
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_tourId: {
          userId,
          tourId,
        },
      },
    });

    return !!wishlistItem;
  }

  /**
   * Get wishlist count for a user
   */
  async getWishlistCount(userId: string): Promise<number> {
    return this.prisma.wishlist.count({
      where: { userId },
    });
  }

  /**
   * Clear entire wishlist for a user
   */
  async clearWishlist(userId: string) {
    const count = await this.prisma.wishlist.count({
      where: { userId },
    });

    if (count === 0) {
      throw new BadRequestException('Your wishlist is already empty');
    }

    await this.prisma.wishlist.deleteMany({
      where: { userId },
    });

    return {
      message: `Cleared ${count} item(s) from wishlist`,
      count,
    };
  }

  /**
   * Get wishlist status for multiple tours (batch check)
   * Useful for marking wishlisted tours in a list view
   */
  async getWishlistStatus(userId: string, tourIds: string[]) {
    const wishlistItems = await this.prisma.wishlist.findMany({
      where: {
        userId,
        tourId: {
          in: tourIds,
        },
      },
      select: {
        tourId: true,
      },
    });

    // Create a map for quick lookup
    const wishlistedTourIds = new Set(wishlistItems.map((item) => item.tourId));

    return tourIds.map((tourId) => ({
      tourId,
      isWishlisted: wishlistedTourIds.has(tourId),
    }));
  }

  /**
   * Get most wishlisted tours (popular tours)
   */
  async getMostWishlisted(limit: number = 10) {
    const tours = await this.prisma.tour.findMany({
      include: {
        _count: {
          select: {
            wishlistedBy: true,
            review: true,
          },
        },
        review: {
          select: { rating: true },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        wishlistedBy: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    // Filter tours that have at least one wishlist entry
    const popularTours = tours
      .filter((tour) => tour._count.wishlistedBy > 0)
      .map((tour) => {
        const totalRating = tour.review.reduce(
          (acc, review) => acc + review.rating,
          0,
        );
        const reviewCount = tour._count.review;
        const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
        const availableSlots = tour.maxParticipants - tour.bookedSlots;

        const { review, _count, ...tourData } = tour;

        return {
          ...tourData,
          reviewCount,
          avgRating: parseFloat(avgRating.toFixed(1)),
          availableSlots,
          isAvailable: availableSlots > 0,
          wishlistCount: _count.wishlistedBy,
        };
      });

    return {
      tours: popularTours,
      count: popularTours.length,
    };
  }
}
