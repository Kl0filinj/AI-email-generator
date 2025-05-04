import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { HttpRepository } from '@libs';
import { HttpModule } from '@nestjs/axios';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [HttpModule, S3Module],
  providers: [HttpRepository, FileService],
  exports: [FileService],
})
export class FileModule {}
