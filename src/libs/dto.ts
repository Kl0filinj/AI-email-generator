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
