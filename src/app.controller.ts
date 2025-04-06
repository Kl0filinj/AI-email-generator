import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AtGuard } from '@libs';

@Controller('email')
@UseGuards(AtGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('all')
  getHello(): string {
    return this.appService.getHello();
  }
}
