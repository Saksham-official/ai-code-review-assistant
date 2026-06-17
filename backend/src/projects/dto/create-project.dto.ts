import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Project name is required.' })
  @MaxLength(100, { message: 'Project name cannot exceed 100 characters.' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Project description cannot exceed 500 characters.' })
  description?: string;
}
