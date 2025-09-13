import {
  ForbiddenException,
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

const supabase_Url = 'https://goiszpiclwkiqgrjpuod.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaXN6cGljbHdraXFncmpwdW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE4MDYxNCwiZXhwIjoyMDcwNzU2NjE0fQ.Fr9NnozlPudXjCYZRRjNKs49ks20R2Rp61P20cQPyPs';
@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService, // We can keep this for now
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

  // getTours() {
  //   return this.prisma.tour.findMany();
  // }

  async getTours() {
    // We use Prisma's aggregation features directly in the query.
    const tours = await this.prisma.tour.findMany({
      include: {
        _count: {
          select: { review: true }, // Select the count of related review
        },
        review: {
          select: { rating: true }, // Select only the rating from review
        },
      },
    });

    // Now we map over the results to calculate the average rating in our application code.
    return tours.map((tour) => {
      const totalRating = tour.review.reduce(
        (acc, review) => acc + review.rating,
        0,
      );
      const reviewCount = tour._count.review;
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // We clean up the response object to send only what's needed.
      const { review, _count, ...tourData } = tour;
      return {
        ...tourData,
        reviewCount,
        avgRating: parseFloat(avgRating.toFixed(1)), // Format to one decimal place
      };
    });
  }

  // getTourById(tourId: string) {
  //   return this.prisma.tour.findUnique({
  //     where: { id: tourId },
  //   });
  // }

  async getTourById(tourId: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        review: {
          select: {
            rating: true,
            comment: true,
          },
        },
        _count: {
          select: { review: true },
        },
      },
    });

    if (!tour) {
      return null;
    }

    // Calculate the average rating
    const totalRating = tour.review.reduce(
      (acc, review) => acc + review.rating,
      0,
    );
    const reviewCount = tour._count.review;
    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    // Extract all review comments into a separate array
    const reviewComments = tour.review.map((review) => review.comment);

    // Clean up the response object
    const { review, _count, ...tourData } = tour;

    return {
      ...tourData,
      reviewCount,
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewComments, // Include the new array of comments
    };
  }

  async updateTourById(userId: string, tourId: string, dto: CreateTourDto) {
    // Get the tour first
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    // Check if the user owns the tour
    if (!tour || tour.providerId !== userId) {
      throw new ForbiddenException('Access to resources denied');
    }

    return this.prisma.tour.update({
      where: { id: tourId },
      data: { ...dto },
    });
  }

  async deleteTourById(userId: string, tourId: string) {
    // Get the tour first
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    // Check if the user owns the tour
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
      },
    });
  }
  //logic for the tour update for the admin
  async adminUpdateTourById(tourId: string, dto: CreateTourDto) {
    // First, check if the tour exists at all
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('Tour not found');

    // Directly update the tour without checking ownership
    return this.prisma.tour.update({
      where: { id: tourId },
      data: { ...dto },
    });
  }

  async adminDeleteTourById(tourId: string) {
    //Check if the tour exists at all
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('tour not found ');

    // Directly delete the tour with out checking the ownership
    return this.prisma.tour.delete({
      where: { id: tourId },
    });
  }

  //Image upload endpoint
  async uploadTourImage(
    userId: string,
    tourId: string,
    file: Express.Multer.File,
  ) {
    this.logger.log(
      `Starting image upload for tourId: ${tourId} by userId: ${userId}`,
    );

    // --- 1. Authorization Check ---
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour || tour.providerId !== userId) {
      this.logger.warn(
        `Authorization failed for userId: ${userId} on tourId: ${tourId}`,
      );
      throw new ForbiddenException('Access to resources denied');
    }
    this.logger.log('Authorization successful.');

    // --- 2. File Validation ---
    if (!file) {
      this.logger.error('File is undefined in service method.');
      throw new InternalServerErrorException('No file provided.');
    }
    this.logger.log(
      `File received: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`,
    );

    // --- 3. Upload to Supabase ---
    const newFileName = `${userId}-${tourId}-${Date.now()}-${file.originalname}`;
    this.logger.log(
      `Attempting to upload to bucket 'tour-images' with new name: ${newFileName}`,
    );

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('tour_image')
      .upload(newFileName, file.buffer, {
        contentType: file.mimetype,
      });

    // --- 4. CRITICAL ERROR HANDLING ---
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

    // --- 5. Get Public URL ---
    const { data: urlData } = this.supabase.storage
      .from('tour_image')
      .getPublicUrl(uploadData.path);

    this.logger.log(`Generated public URL: ${urlData.publicUrl}`);

    // --- 6. Update Database ---
    const updatedTour = await this.prisma.tour.update({
      where: { id: tourId },
      data: { imageUrl: urlData.publicUrl },
    });
    this.logger.log(`Database updated successfully for tourId: ${tourId}`);

    return updatedTour;
  }
}
