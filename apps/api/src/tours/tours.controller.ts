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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { CreateTourDto } from './dto/create-tour.dto';
import { ToursService } from './tours.service';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tours') // base url
export class ToursController {
  constructor(private toursService: ToursService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  createTour(@GetUser('id') userId: string, @Body() dto: CreateTourDto) {
    return this.toursService.createTour(userId, dto);
  }

  @Get()
  getTours() {
    return this.toursService.getTours();
  }

  @Get(':id')
  getTourById(@Param('id') tourId: string) {
    return this.toursService.getTourById(tourId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  updateTourById(
    @GetUser('id') userId: string,
    @Param('id') tourId: string,
    @Body() dto: CreateTourDto,
  ) {
    // at this point the dto is an instance of CreateTourDto
    // like { name: 'New name', location: 'New location'.... }
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
  @UseInterceptors(FileInterceptor('file')) // Tells NestJS to process one file from the 'file' field
  uploadTourImage(
    @GetUser('id') userId: string,
    @Param('id') tourId: string,
    @UploadedFile() file: Express.Multer.File, // Injects the file object
  ) {
    return this.toursService.uploadTourImage(userId, tourId, file);
  }
}
