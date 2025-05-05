import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, firstValueFrom, map, retry } from 'rxjs';
import { Readable } from 'stream';
import { COMPANIES_API_BASE_URL, HUNTER_API_BASE_URL } from '../constants';
import { ConfigService } from '@nestjs/config';
import {
  CompanyOfficersResponseDto,
  GetCompanyEmailDto,
  HunterMailResponseDto,
} from '../dto';

@Injectable()
export class HttpRepository {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getCompanyOfficers(
    companyId: string,
  ): Promise<CompanyOfficersResponseDto> {
    const url = `${COMPANIES_API_BASE_URL}/company/${companyId}/officers`;
    const headers = {
      Authorization: `Basic ${Buffer.from(this.configService.get('COMPANY_API_KEY') + ':').toString('base64')}`,
    };
    const params = {
      items_per_page: 10,
      register_type: 'directors',
      filter: 'active',
      order_by: 'appointed_on',
    };

    try {
      const response = await firstValueFrom(
        this.httpService
          .get(url, { headers, params })
          .pipe(map((resp) => resp.data)),
      );
      //   console.log(
      //     '@@ RESPONSE COMPANY OFFICIALS : ',
      //     JSON.stringify(response, null, ' '),
      //   );

      return {
        companyId,
        officers: response.items.map((item) => ({
          name: item.name,
          appointedDate: item.appointed_on,
          role: item.officer_role,
        })),
      };
    } catch (error) {
      const message = error.response?.data || error.message;
      console.error(
        'ERROR COMPANY OFFICIALS GET: ',
        error.response?.data || error.message,
      );
      //   console.log(error);
      throw new Error(message);
    }
  }

  async getCompanyEmail(
    dto: GetCompanyEmailDto,
  ): Promise<HunterMailResponseDto> {
    const { firstName, lastName, domain } = dto;
    const url = `${HUNTER_API_BASE_URL}/email-finder`;
    const params = {
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: this.configService.get('HUNTER_API_KEY'),
    };

    try {
      const response = await firstValueFrom(
        this.httpService
          .get(url, { params })
          .pipe(map((resp) => resp.data.data)),
      );

      return {
        verification: response.verification?.status,
        score: response.score,
        email: response.email,
      };
    } catch (error) {
      const message = error.response?.data || error.message;
      console.error(
        'ERROR HUNTER EMAIL GET: ',
        error.response?.data || error.message,
      );
      //   console.log(error);
      throw new Error(message);
    }
  }
}
