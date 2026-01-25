// apps/api/src/tours/tours.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateTourDto } from './dto/create-tour.dto';
import { QueryToursDto } from './dto/query-tours.dto';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(private toursService: ToursService) {}

  // PUBLIC ROUTES

  @Get()
  getTours() {
    return this.toursService.getTours();
  }

  @Get('search')
  searchAndFilterTours(@Query() query: QueryToursDto) {
    return this.toursService.searchAndFilterTours(query);
  }

  @Get('popular-locations')
  getPopularLocations(@Query('limit') limit?: number) {
    return this.toursService.getPopularLocations(
      limit ? parseInt(limit as any) : 10,
    );
  }

  @Get('price-range')
  getPriceRange() {
    return this.toursService.getPriceRange();
  }

  @Get(':id')
  getTourById(@Param('id') tourId: string) {
    return this.toursService.getTourById(tourId);
  }

  // AUTHENTICATED USER ROUTES

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  updateTourById(
    @GetUser('id') userId: string,
    @Param('id') tourId: string,
    @Body() dto: CreateTourDto,
  ) {
    return this.toursService.updateTourById(userId, tourId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteTourById(@GetUser('id') userId: string, @Param('id') tourId: string) {
    return this.toursService.deleteTourById(userId, tourId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadTourImage(
    @GetUser('id') userId: string,
    @Param('id') tourId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.toursService.uploadTourImage(userId, tourId, file);
  }

  // ADMIN ROUTES

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post()
  createTour(@GetUser('id') userId: string, @Body() dto: CreateTourDto) {
    return this.toursService.createTour(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('admin/all')
  adminGetAllTours() {
    return this.toursService.adminGetAllTours();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch('admin/:id')
  adminUpdateTourById(@Param('id') tourId: string, @Body() dto: CreateTourDto) {
    return this.toursService.adminUpdateTourById(tourId, dto);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('admin/:id')
  adminDeleteTourById(@Param('id') tourId: string) {
    return this.toursService.adminDeleteTourById(tourId);
  }
}
