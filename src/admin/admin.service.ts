import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, LoginResponseDto } from '@libs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = dto;

    //* Check incoming login data
    const usernameMatch = username === this.configService.get('ADMIN_LOGIN');
    const passwordMatch = password === this.configService.get('ADMIN_PASSWORD');

    if (!usernameMatch || !passwordMatch) {
      throw new UnauthorizedException();
    }

    const tokenPayload = { username, isAdmin: true };
    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return { accessToken };
  }
}
