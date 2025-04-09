import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, LoginResponseDto } from '@libs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { createReadStream } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';

@Injectable()
export class AdminService {
  private readonly uploadDir = join(process.cwd(), '../uploads');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = dto;

    //* Check incoming login data
    const usernameMatch = username === this.configService.get('ADMIN_USERNAME');
    const passwordMatch = password === this.configService.get('ADMIN_PASSWORD');

    if (!usernameMatch || !passwordMatch) {
      throw new UnauthorizedException();
    }

    const tokenPayload = { username, isAdmin: true };
    let accessToken: string;

    try {
      accessToken = await this.jwtService.signAsync(tokenPayload);
    } catch (error) {
      throw new NotImplementedException('Token error');
    }

    return { accessToken };
  }

  async getAllFiles() {
    const files = await readdir(this.uploadDir);

    const response = [];
    for (const file of files) {
      const filePath = join(this.uploadDir, file);
      const stats = await stat(filePath);
      response.push({ name: file, size: stats.size });
    }
    return response;
  }

  async getSpecificFile(filename: string) {
    try {
      const filePath = join(this.uploadDir, filename);
      const fileStream = createReadStream(filePath);
      return fileStream;
    } catch (error) {
      throw new NotFoundException('File was not found');
    }
  }

  async deleteSpecificFile(filename: string) {
    const filePath = join(this.uploadDir, filename);
    try {
      await unlink(filePath);
      return { message: `File ${filename} has been successfully deleted.` };
    } catch (error) {
      throw new NotFoundException('File not found or could not be deleted');
    }
  }
}
