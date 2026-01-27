import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  @MaxLength(50, { message: 'Category name cannot exceed 50 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'Icon must be a single emoji or short string' })
  icon?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #FF6B6B)',
  })
  color?: string;
}
