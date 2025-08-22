import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourDto } from './dto/create-tour.dto';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async createTour(userId: string, dto: CreateTourDto) {
    const tour = await this.prisma.tour.create({
      data: {
        providerId: userId,
        ...dto,
      },
    });
    return tour;
  }

  getTours() {
    return this.prisma.tour.findMany();
  }

  getTourById(tourId: string) {
    return this.prisma.tour.findUnique({
      where: { id: tourId },
    });
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
}
