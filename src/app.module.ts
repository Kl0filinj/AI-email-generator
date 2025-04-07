import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AtStrategy } from '@libs';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AdminModule],
  providers: [AtStrategy],
})
export class AppModule {}
