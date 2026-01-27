// apps/api/src/categories/categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AssignCategoriesToTourDto } from './dto/assign-categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // PUBLIC ROUTES

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('popular')
  getPopularCategories(@Query('limit') limit?: string) {
    return this.categoriesService.getPopularCategories(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('stats')
  getCategoryStats() {
    return this.categoriesService.getCategoryStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id/tours')
  getToursByCategory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.categoriesService.getToursByCategory(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  // ADMIN ROUTES

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('tours/:tourId/assign')
  @HttpCode(HttpStatus.OK)
  assignCategoriesToTour(
    @Param('tourId') tourId: string,
    @Body() dto: AssignCategoriesToTourDto,
  ) {
    return this.categoriesService.assignCategoriesToTour(tourId, dto);
  }
}
