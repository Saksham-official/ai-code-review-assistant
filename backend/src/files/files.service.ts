import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import AdmZip from 'adm-zip';
import * as path from 'path';

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  id?: string;
  children?: FileTreeNode[];
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  // Common folders/files to ignore during code review upload
  private readonly IGNORED_PATHS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'target',
    'bin',
    'obj',
    'venv',
    '.env',
    '.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    '__pycache__',
  ];

  // Common binary extensions to ignore
  private readonly BINARY_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
    '.pdf', '.zip', '.tar', '.gz', '.rar',
    '.mp4', '.mp3', '.wav', '.mov',
    '.woff', '.woff2', '.ttf', '.eot',
    '.dll', '.exe', '.pyc', '.o', '.class', '.jar', '.war',
    '.db', '.sqlite', '.db3',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async processZipUpload(projectId: string, fileBuffer: Buffer) {
    let zip: AdmZip;
    try {
      zip = new AdmZip(fileBuffer);
    } catch (error) {
      throw new BadRequestException('Invalid ZIP archive.');
    }

    const zipEntries = zip.getEntries();
    const filesToCreate: { path: string; name: string; content: string; projectId: string }[] = [];

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue;
      }

      const rawPath = entry.entryName.replace(/\\/g, '/'); // Normalize path delimiters to forward slashes
      
      // Check if path contains ignored folder segments
      const pathSegments = rawPath.split('/');
      const isIgnored = pathSegments.some(segment => this.IGNORED_PATHS.includes(segment));
      if (isIgnored) {
        continue;
      }

      // Check for binary extensions
      const ext = path.extname(rawPath).toLowerCase();
      if (this.BINARY_EXTENSIONS.includes(ext)) {
        continue;
      }

      // Extract file content
      let content = '';
      try {
        const buffer = entry.getData();
        // Skip empty or purely binary-looking buffers (containing NULL bytes)
        if (buffer.includes(0x00)) {
          continue;
        }
        content = buffer.toString('utf8');
      } catch (err) {
        this.logger.warn(`Failed to read file contents for entry: ${rawPath}`);
        continue;
      }

      const name = path.basename(rawPath);
      filesToCreate.push({
        path: rawPath,
        name,
        content,
        projectId,
      });
    }

    if (filesToCreate.length === 0) {
      throw new BadRequestException('No readable text/source-code files found in the ZIP upload.');
    }

    // Delete existing files under the project to prevent stale code files
    await this.prisma.file.deleteMany({
      where: { projectId },
    });

    // Write all new files in batch transactions
    await this.prisma.file.createMany({
      data: filesToCreate,
    });

    return {
      success: true,
      filesUploaded: filesToCreate.length,
      message: `Successfully uploaded and processed ${filesToCreate.length} code files.`,
    };
  }

  async getFileTree(projectId: string): Promise<FileTreeNode[]> {
    const files = await this.prisma.file.findMany({
      where: { projectId },
      select: { id: true, path: true, name: true },
      orderBy: { path: 'asc' },
    });

    const root: FileTreeNode[] = [];

    for (const file of files) {
      const parts = file.path.split('/');
      let currentLevel = root;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = i === parts.length - 1;

        if (isLast) {
          // It's a file
          currentLevel.push({
            name: part,
            path: file.path,
            isDir: false,
            id: file.id,
          });
        } else {
          // It's a directory
          let dirNode = currentLevel.find(node => node.isDir && node.name === part);

          if (!dirNode) {
            dirNode = {
              name: part,
              path: currentPath,
              isDir: true,
              children: [],
            };
            currentLevel.push(dirNode);
          }

          currentLevel = dirNode.children!;
        }
      }
    }

    // Recursively sort files: directories first, then files alphabetically
    const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      nodes.sort((a, b) => {
        if (a.isDir !== b.isDir) {
          return a.isDir ? -1 : 1; // Dir first
        }
        return a.name.localeCompare(b.name);
      });

      for (const node of nodes) {
        if (node.isDir && node.children) {
          sortTree(node.children);
        }
      }

      return nodes;
    };

    return sortTree(root);
  }

  async getFileContent(fileId: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`File with ID "${fileId}" not found.`);
    }

    if (file.project.userId !== userId) {
      throw new BadRequestException('You do not have permission to view this file.');
    }

    return {
      id: file.id,
      name: file.name,
      path: file.path,
      content: file.content,
      projectId: file.projectId,
      createdAt: file.createdAt,
    };
  }
}
