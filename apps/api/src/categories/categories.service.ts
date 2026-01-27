// apps/api/src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AssignCategoriesToTourDto } from './dto/assign-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Create slug from name
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Create a new category (Admin only)
  async create(dto: CreateCategoryDto) {
    const slug = this.createSlug(dto.name);

    // Check if category with same name or slug exists
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: slug }],
      },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name "${dto.name}" already exists`,
      );
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
      },
    });
  }

  // Get all categories
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { tours: true },
        },
      },
    });
  }

  // Get category by ID
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tours: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  // Get category by slug
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { tours: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    return category;
  }

  // Update category (Admin only)
  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // If name is being updated, create new slug
    const updateData: any = { ...dto };
    if (dto.name) {
      updateData.slug = this.createSlug(dto.name);

      // Check if new slug conflicts with existing category
      const existing = await this.prisma.category.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Category with name "${dto.name}" already exists`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  // Delete category (Admin only)
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tours: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Optional: Prevent deletion if category has tours
    if (category._count.tours > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${category._count.tours} tour(s) assigned. Please remove the tours first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: `Category "${category.name}" deleted successfully` };
  }

  // Get tours by category
  async getToursByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found`);
    }

    const skip = (page - 1) * limit;

    const [tours, totalCount] = await Promise.all([
      this.prisma.tour.findMany({
        where: {
          categories: {
            some: {
              categoryId: categoryId,
            },
          },
        },
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
                select: { name: true, slug: true, icon: true, color: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tour.count({
        where: {
          categories: {
            some: {
              categoryId: categoryId,
            },
          },
        },
      }),
    ]);

    // Calculate ratings
    const processedTours = tours.map((tour) => {
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
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
      },
      tours: processedTours,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Assign categories to a tour (Admin only)
  async assignCategoriesToTour(tourId: string, dto: AssignCategoriesToTourDto) {
    // Verify tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID "${tourId}" not found`);
    }

    // Verify all categories exist
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: dto.categoryIds },
      },
    });

    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('One or more category IDs are invalid');
    }

    // Remove existing category assignments
    await this.prisma.tourCategory.deleteMany({
      where: { tourId },
    });

    // Create new assignments
    const assignments = await this.prisma.tourCategory.createMany({
      data: dto.categoryIds.map((categoryId) => ({
        tourId,
        categoryId,
      })),
    });

    // Return updated tour with categories
    return this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
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
    });
  }

  // Get popular categories (most used)
  async getPopularCategories(limit: number = 10) {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { tours: true },
        },
      },
      orderBy: {
        tours: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      color: category.color,
      tourCount: category._count.tours,
    }));
  }

  // Get category statistics
  async getCategoryStats() {
    const totalCategories = await this.prisma.category.count();
    const categoriesWithTours = await this.prisma.category.count({
      where: {
        tours: {
          some: {},
        },
      },
    });

    const categoryTourCounts = await this.prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { tours: true },
        },
      },
      orderBy: {
        tours: {
          _count: 'desc',
        },
      },
    });

    return {
      totalCategories,
      categoriesWithTours,
      categoriesWithoutTours: totalCategories - categoriesWithTours,
      categoryDistribution: categoryTourCounts.map((cat) => ({
        name: cat.name,
        tourCount: cat._count.tours,
      })),
    };
  }
}
