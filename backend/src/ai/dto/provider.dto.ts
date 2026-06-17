import { IsNotEmpty, IsOptional, IsString, IsUrl, IsBoolean } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty({ message: 'Provider profile name is required.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Base URL is required.' })
  baseUrl: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsNotEmpty({ message: 'Model name is required.' })
  modelName: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateProviderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class TestProviderDto {
  @IsString()
  @IsNotEmpty({ message: 'Base URL is required.' })
  baseUrl: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsNotEmpty({ message: 'Model name is required.' })
  modelName: string;
}
