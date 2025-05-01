import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AtStrategy } from '@libs';
import { FileModule } from './file/file.module';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AdminModule,
    FileModule,
    PrismaModule,
    S3Module,
  ],
  providers: [AtStrategy],
})
export class AppModule {}
