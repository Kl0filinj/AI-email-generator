import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AtStrategy } from '@libs';
import { FileModule } from './file/file.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AdminModule, FileModule],
  providers: [AtStrategy],
})
export class AppModule {}
