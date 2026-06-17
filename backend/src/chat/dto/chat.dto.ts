import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Session title is required.' })
  @MaxLength(150, { message: 'Title cannot exceed 150 characters.' })
  title: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty.' })
  content: string;

  @IsString()
  @IsOptional()
  providerId?: string;
}
