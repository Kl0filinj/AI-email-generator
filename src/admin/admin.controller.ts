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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AtGuard, LoginDto } from '@libs';
import { Response } from 'express';

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
