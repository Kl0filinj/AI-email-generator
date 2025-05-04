import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, LoginResponseDto } from '@libs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FileService } from 'src/file/file.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly filesService: FileService,
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
    return this.filesService.getAllFiles();
  }

  async processFiles(file: Express.Multer.File) {
    return this.filesService.generateOutput(file);
  }

  // async getSpecificFile(filename: string) {
  //   try {
  //     const filePath = join(this.uploadDir, filename);
  //     const fileStream = createReadStream(filePath);
  //     return fileStream;
  //   } catch (error) {
  //     throw new NotFoundException('File was not found');
  //   }
  // }

  async deleteSpecificFile(id: string) {
    await this.filesService.deleteFile(id);
    return { message: `File ${id} was successfully deleted` };
  }
}
