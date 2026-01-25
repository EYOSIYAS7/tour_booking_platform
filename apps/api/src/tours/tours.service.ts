// apps/api/src/tours/tours.service.ts
import {
  ForbiddenException,
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { QueryToursDto, SortBy } from './dto/query-tours.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

const supabase_Url = 'https://goiszpiclwkiqgrjpuod.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaXN6cGljbHdraXFncmpwdW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE4MDYxNCwiZXhwIjoyMDcwNzU2NjE0fQ.Fr9NnozlPudXjCYZRRjNKs49ks20R2Rp61P20cQPyPs';

@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(supabase_Url, supabaseKey);
    this.logger.log('Supabase client initialized for debugging.');
  }

  async createTour(userId: string, dto: CreateTourDto) {
    const tour = await this.prisma.tour.create({
      data: {
        providerId: userId,
        ...dto,
      },
    });
    return tour;
  }

  async getTours() {
    const tours = await this.prisma.tour.findMany({
      include: {
        _count: {
          select: { review: true },
        },
        review: {
          select: { rating: true },
        },
      },
    });

    return tours.map((tour) => {
      const totalRating = tour.review.reduce(
        (acc, review) => acc + review.rating,
        0,
      );
      const reviewCount = tour._count.review;
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      const { review, _count, ...tourData } = tour;
      return {
        ...tourData,
        reviewCount,
        avgRating: parseFloat(avgRating.toFixed(1)),
        availableSlots: tour.maxParticipants - tour.bookedSlots,
      };
    });
  }

  async searchAndFilterTours(query: QueryToursDto) {
    const {
      search,
      location,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      minRating,
      availableOnly,
      sortBy = SortBy.CREATED_DESC,
      page = 1,
      limit = 10,
    } = query;

    // Build the where clause
    const where: Prisma.TourWhereInput = {};

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by location
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      if (!where.AND) {
        where.AND = [];
      }
      if (startDate) {
        (where.AND as Prisma.TourWhereInput[]).push({
          startDate: { gte: new Date(startDate) },
        });
      }
      if (endDate) {
        (where.AND as Prisma.TourWhereInput[]).push({
          endDate: { lte: new Date(endDate) },
        });
      }
    }

    // Filter by availability
    if (availableOnly) {
      if (!where.AND) {
        where.AND = [];
      }
      (where.AND as Prisma.TourWhereInput[]).push({
        bookedSlots: { lt: this.prisma.tour.fields.maxParticipants },
      });
    }

    // Build the orderBy clause
    const orderBy: Prisma.TourOrderByWithRelationInput[] = [];

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        orderBy.push({ price: 'asc' });
        break;
      case SortBy.PRICE_DESC:
        orderBy.push({ price: 'desc' });
        break;
      case SortBy.DATE_ASC:
        orderBy.push({ startDate: 'asc' });
        break;
      case SortBy.DATE_DESC:
        orderBy.push({ startDate: 'desc' });
        break;
      case SortBy.CREATED_DESC:
        orderBy.push({ createdAt: 'desc' });
        break;
      // For rating and popularity, we'll handle these separately
      default:
        orderBy.push({ createdAt: 'desc' });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute the query
    const [tours, totalCount] = await Promise.all([
      this.prisma.tour.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { review: true, bookings: true },
          },
          review: {
            select: { rating: true },
          },
        },
      }),
      this.prisma.tour.count({ where }),
    ]);

    // Calculate ratings and filter by minRating if provided
    let processedTours = tours.map((tour) => {
      const totalRating = tour.review.reduce(
        (acc, review) => acc + review.rating,
        0,
      );
      const reviewCount = tour._count.review;
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const bookingCount = tour._count.bookings;
      const availableSlots = tour.maxParticipants - tour.bookedSlots;

      const { review, _count, ...tourData } = tour;
      return {
        ...tourData,
        reviewCount,
        avgRating: parseFloat(avgRating.toFixed(1)),
        bookingCount,
        availableSlots,
        isAvailable: availableSlots > 0,
      };
    });

    // Filter by minimum rating (after calculation)
    if (minRating !== undefined) {
      processedTours = processedTours.filter(
        (tour) => tour.avgRating >= minRating,
      );
    }

    // Sort by rating or popularity if specified
    if (sortBy === SortBy.RATING_DESC) {
      processedTours.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sortBy === SortBy.POPULARITY_DESC) {
      processedTours.sort((a, b) => b.bookingCount - a.bookingCount);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: processedTours,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        search,
        location,
        minPrice,
        maxPrice,
        startDate,
        endDate,
        minRating,
        availableOnly,
        sortBy,
      },
    };
  }

  async getTourById(tourId: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        review: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: { review: true, bookings: true },
        },
        provider: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!tour) {
      return null;
    }

    const totalRating = tour.review.reduce(
      (acc, review) => acc + review.rating,
      0,
    );
    const reviewCount = tour._count.review;
    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    const bookingCount = tour._count.bookings;
    const availableSlots = tour.maxParticipants - tour.bookedSlots;

    const { review, _count, ...tourData } = tour;

    return {
      ...tourData,
      reviewCount,
      avgRating: parseFloat(avgRating.toFixed(1)),
      bookingCount,
      availableSlots,
      isAvailable: availableSlots > 0,
      reviews: review.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userName: r.user.name || r.user.email,
      })),
    };
  }

  async updateTourById(userId: string, tourId: string, dto: CreateTourDto) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour || tour.providerId !== userId) {
      throw new ForbiddenException('Access to resources denied');
    }

    return this.prisma.tour.update({
      where: { id: tourId },
      data: { ...dto },
    });
  }

  async deleteTourById(userId: string, tourId: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour || tour.providerId !== userId) {
      throw new ForbiddenException('Access to resources denied');
    }

    await this.prisma.tour.delete({
      where: { id: tourId },
    });
  }

  // -- ADMIN LOGIC --
  async adminGetAllTours() {
    return this.prisma.tour.findMany({
      include: {
        provider: {
          select: { email: true },
        },
        _count: {
          select: { bookings: true, review: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async adminUpdateTourById(tourId: string, dto: CreateTourDto) {
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('Tour not found');

    return this.prisma.tour.update({
      where: { id: tourId },
      data: { ...dto },
    });
  }

  async adminDeleteTourById(tourId: string) {
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('tour not found ');

    return this.prisma.tour.delete({
      where: { id: tourId },
    });
  }

  async uploadTourImage(
    userId: string,
    tourId: string,
    file: Express.Multer.File,
  ) {
    this.logger.log(
      `Starting image upload for tourId: ${tourId} by userId: ${userId}`,
    );

    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour || tour.providerId !== userId) {
      this.logger.warn(
        `Authorization failed for userId: ${userId} on tourId: ${tourId}`,
      );
      throw new ForbiddenException('Access to resources denied');
    }

    this.logger.log('Authorization successful.');

    if (!file) {
      this.logger.error('File is undefined in service method.');
      throw new InternalServerErrorException('No file provided.');
    }

    this.logger.log(
      `File received: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`,
    );

    const newFileName = `${userId}-${tourId}-${Date.now()}-${file.originalname}`;
    this.logger.log(
      `Attempting to upload to bucket 'tour-images' with new name: ${newFileName}`,
    );

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('tour_image')
      .upload(newFileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      this.logger.error('Supabase upload failed!', uploadError);
      throw new InternalServerErrorException(
        `Storage error: ${uploadError.message}`,
      );
    }

    if (!uploadData) {
      this.logger.error('Supabase upload returned no data and no error.');
      throw new InternalServerErrorException(
        'Upload failed with no data returned.',
      );
    }

    this.logger.log(`Supabase upload successful. Path: ${uploadData.path}`);

    const { data: urlData } = this.supabase.storage
      .from('tour_image')
      .getPublicUrl(uploadData.path);

    this.logger.log(`Generated public URL: ${urlData.publicUrl}`);

    const updatedTour = await this.prisma.tour.update({
      where: { id: tourId },
      data: { imageUrl: urlData.publicUrl },
    });

    this.logger.log(`Database updated successfully for tourId: ${tourId}`);

    return updatedTour;
  }

  // Get popular locations
  async getPopularLocations(limit: number = 10) {
    const locations = await this.prisma.tour.groupBy({
      by: ['location'],
      _count: {
        location: true,
      },
      orderBy: {
        _count: {
          location: 'desc',
        },
      },
      take: limit,
    });

    return locations.map((loc) => ({
      location: loc.location,
      tourCount: loc._count.location,
    }));
  }

  // Get price range statistics
  async getPriceRange() {
    const stats = await this.prisma.tour.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
    });

    return {
      minPrice: stats._min.price || 0,
      maxPrice: stats._max.price || 0,
      avgPrice: stats._avg.price ? Math.round(stats._avg.price) : 0,
    };
  }
}