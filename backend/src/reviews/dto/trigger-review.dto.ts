import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class TriggerReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Review template type is required.' })
  template: string; // 'security' | 'performance' | 'quality' | 'tech_debt' | 'architecture'

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  filePaths?: string[];

  @IsString()
  @IsOptional()
  providerId?: string;
}
