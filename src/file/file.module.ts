import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { HttpRepository } from '@libs';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [HttpRepository, FileService],
  exports: [FileService],
})
export class FileModule {}
