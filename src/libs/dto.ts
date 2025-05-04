import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
}

export class CompanyOfficerResponseEntity {
  name: string;
  appointedDate: string;
  role: string;
}
export class CompanyOfficersResponseDto {
  companyId: string;
  officers: CompanyOfficerResponseEntity[];
}

export class GetCompanyEmailDto {
  firstName: string;
  lastName: string;
  domain: string;
}

export class HunterMailResponseDto {
  verification: string | null;
  score: number | null;
  email: string | null;
}

export class UploadFileDto {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

export class UploadFileToS3ResponseDto {
  storedId: string;
  url: string;
}

export class FileResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ obj }) => obj.originalName || obj.name)
  name: string;

  @Expose()
  size: number;

  @Expose()
  url: string;
}
