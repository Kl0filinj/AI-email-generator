import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { allowedMimeTypes, AtGuard, LoginDto, MAX_FILE_SIZE } from '@libs';
import { Response } from 'express';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    try {
      return this.adminService.login(dto);
    } catch (error) {
      console.log('@@ error : ', error);
      throw new InternalServerErrorException(error.message || 'Internal error');
    }
  }

  @Get('me')
  @UseGuards(AtGuard)
  getMe() {
    return { message: 'ok' };
  }

  @Get('files')
  @UseGuards(AtGuard)
  async getAllFiles() {
    return this.adminService.getAllFiles();
  }

  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  async processFiles(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: allowedMimeTypes,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    await new Promise((resolve) => {
      setTimeout(() => resolve('Response after 5 seconds'), 5000);
    });
    return this.adminService.processFiles(file);
  }

  @Get('files/:filename')
  @UseGuards(AtGuard)
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const fileStream = await this.adminService.getSpecificFile(filename);
    fileStream.pipe(res);
  }

  @Delete('files/:filename')
  async deleteFile(@Param('filename') filename: string) {
    return this.adminService.deleteSpecificFile(filename);
  }
}
