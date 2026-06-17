import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProjectsModule, AuthModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
