import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('projects/:projectId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadZip(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Please upload a ZIP file.');
    }

    // Verify project exists and is owned by the user
    await this.projectsService.findOne(projectId, req.user.id);

    return this.filesService.processZipUpload(projectId, file.buffer);
  }

  @Get('projects/:projectId/files/tree')
  async getFileTree(@Param('projectId') projectId: string, @Req() req: any) {
    // Verify project exists and is owned by the user
    await this.projectsService.findOne(projectId, req.user.id);

    return this.filesService.getFileTree(projectId);
  }

  @Get('files/:fileId')
  async getFileContent(@Param('fileId') fileId: string, @Req() req: any) {
    return this.filesService.getFileContent(fileId, req.user.id);
  }
}
