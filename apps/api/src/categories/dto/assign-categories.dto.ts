import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class AssignCategoriesToTourDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category must be assigned' })
  @ArrayMaxSize(5, {
    message: 'Maximum 5 categories can be assigned to a tour',
  })
  @IsString({ each: true })
  categoryIds: string[];
}
