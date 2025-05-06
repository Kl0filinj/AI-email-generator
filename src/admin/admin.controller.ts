import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { allowedMimeTypes, AtGuard, LoginDto, MAX_FILE_SIZE } from '@libs';
import { FileInterceptor } from '@nestjs/platform-express';

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

  //#region Files

  @Get('files')
  @UseGuards(AtGuard)
  async getAllFiles() {
    return this.adminService.getAllFiles();
  }

  @Post('files')
  @UseGuards(AtGuard)
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
    return this.adminService.processFiles(file);
  }

  //! OBSOLETE (We have a signed url for the file)
  // @Get('files/:filename')
  // @UseGuards(AtGuard)
  // async getFile(@Param('filename') filename: string, @Res() res: Response) {
  //   const fileStream = await this.adminService.getSpecificFile(filename);
  //   fileStream.pipe(res);
  // }

  @Delete('files/:id')
  @UseGuards(AtGuard)
  async deleteFile(@Param('id') id: string) {
    return this.adminService.deleteSpecificFile(id);
  }

  //#endregion
}
