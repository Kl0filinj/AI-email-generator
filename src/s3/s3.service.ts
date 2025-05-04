import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadFileDto, UploadFileToS3ResponseDto } from '@libs';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class S3Service {
  private readonly region: string;
  private readonly bucket: string;
  private readonly s3: S3Client;

  constructor() {
    this.region = process.env.AWS_S3_REGION || 'eu-north-1';
    this.bucket = process.env.AWS_S3_BUCKET_NAME;
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      },
    });
  }

  async uploadFile(file: UploadFileDto): Promise<UploadFileToS3ResponseDto> {
    const randomValue = Math.floor(Math.random() * 1000000);
    const hashedFileName = crypto
      .createHash('md5')
      .update(`${file.originalname}-${randomValue}`)
      .digest('hex');
    const ext = file.originalname.slice(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );
    const key = hashedFileName + ext;

    const input: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      Metadata: {
        'Content-Type': file.mimetype,
        'Content-Disposition': `inline`,
      },
    };
    // console.log('input : ', input);

    try {
      const response: PutObjectCommandOutput = await this.s3.send(
        new PutObjectCommand(input),
      );
      if (response.$metadata.httpStatusCode === 200) {
        const fileUrl = await this.getFileUrl(key, file.originalname);
        return { storedId: key, url: fileUrl };
      }
      console.log('@@ S3 RESPONSE : ', response);

      throw new Error('Failed to upload file to S3');
    } catch (error) {
      console.log('S3 ERROR : ', error.message ?? error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async getFileUrl(key: string, originalName?: string) {
    if (key.includes('http')) {
      return key;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: originalName
        ? `attachment; filename="${originalName}"`
        : undefined,
    });
    return await getSignedUrl(this.s3, command);
  }

  async deleteFile(storedId: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storedId,
        }),
      );
    } catch (err) {
      throw new Error('Failed to delete file from S3');
    }
  }
}
