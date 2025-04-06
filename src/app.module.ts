import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AtStrategy } from '@libs';

@Module({
  imports: [ConfigModule.forRoot(), AdminModule],
  controllers: [AppController],
  providers: [AppService, AtStrategy],
})
export class AppModule {}
