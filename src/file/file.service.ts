import {
  FileEntity,
  HttpRepository,
  removeMiddleName,
  tryCatchWrapper,
  FileResponseDto,
  UploadFileToS3ResponseDto,
  TRANSFORM_OPTIONS,
} from '@libs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import * as ExcelJS from 'exceljs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  private emailRequestCount = 0;
  private readonly emailRequestLimit: number;

  constructor(
    private readonly httpRepository: HttpRepository,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.emailRequestLimit =
      this.configService.get('EMAIL_REQUEST_LIMIT') || 1000;
  }

  async getAllFiles(): Promise<FileResponseDto[]> {
    const allFiles = await this.prisma.file.findMany({
      select: {
        id: true,
        size: true,
        originalName: true,
        storedId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const filesWithUrl = await Promise.all(
      allFiles.map(async (file) => {
        const url = await this.s3Service.getFileUrl(
          file.storedId,
          file.originalName,
        );
        return { ...file, url };
      }),
    );
    const plainedFiles = plainToInstance(
      FileResponseDto,
      filesWithUrl,
      TRANSFORM_OPTIONS,
    );
    return plainedFiles;
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { storedId: true },
    });

    if (!file) {
      throw new NotFoundException(`File ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tryCatchWrapper(
        tx.file.delete({
          where: { id },
        }),
        'Failed to delete file from database',
      );

      await tryCatchWrapper(
        this.s3Service.deleteFile(file.storedId),
        'Failed to delete file from S3',
      );
    });
  }

  async generateOutput(file: Express.Multer.File): Promise<FileResponseDto> {
    this.emailRequestCount = 0;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    // TODO: For now, output is disabled
    // const worksheet = workbook.addWorksheet('Output');

    //* Here we SUPPLEMENT the input file and get the data for output part
    const parsedInputData = await this.parseInputData(workbook);
    console.log('@@ parsedInputData: ', parsedInputData);

    // TODO: For now, output is disabled
    // const baseColWidth = 30;
    // worksheet.columns = [
    //   { header: 'Company Name', key: 'companyName', width: baseColWidth },
    //   {
    //     header: 'Company Name ???',
    //     key: 'companyNameFooBar',
    //     width: baseColWidth,
    //   },
    //   { header: 'Contact Person', key: 'contactPerson', width: baseColWidth },
    //   { header: 'Industry', key: 'industry', width: baseColWidth },
    //   {
    //     header: 'Industry Advantages',
    //     key: 'industryAdv',
    //     width: baseColWidth,
    //   },
    //   {
    //     header: 'Website Information',
    //     key: 'websiteInfo',
    //     width: baseColWidth,
    //   },
    //   { header: 'LinkedIn Link', key: 'linkedinLink', width: baseColWidth },
    //   {
    //     header: 'Linkedin Informationen',
    //     key: 'LinkedinInfo',
    //     width: baseColWidth,
    //   },
    //   { header: 'Total Cost in $', key: 'totalCost', width: baseColWidth },
    //   { header: 'Email', key: 'contactPersonEmail', width: baseColWidth + 5 },
    //   { header: 'Error', key: 'error', width: baseColWidth },
    // ];
    // const headerRow = worksheet.getRow(1);
    // headerRow.eachCell((cell) => {
    //   cell.font = {
    //     bold: true,
    //     color: { argb: 'FFFFFFFF' },
    //     size: 15,
    //   };
    //   cell.fill = {
    //     type: 'pattern',
    //     pattern: 'solid',
    //     fgColor: { argb: 'FF279127' },
    //   };
    // });

    // for (const data of parsedInputData) {
    //   worksheet.addRow(data);
    // }

    console.log('@@ TOTAL REQ COUNT PER THIS FILE: ', this.emailRequestCount);
    const fileName = `output-${this.formatOutputDate(new Date())}.xlsx`;
    const outputFileBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const { storedId, url } = await tryCatchWrapper<UploadFileToS3ResponseDto>(
      this.s3Service.uploadFile({
        originalname: fileName,
        buffer: outputFileBuffer as Buffer,
        mimetype: file.mimetype,
      }),
    );
    const { id, originalName, size } = await tryCatchWrapper<FileEntity>(
      this.prisma.file.create({
        data: {
          storedId,
          originalName: fileName,
          size: outputFileBuffer.length,
        },
      }),
      'Failed to create file in DB',
    );

    return { id, name: originalName, size, url };
  }

  private async parseInputData(workbook: ExcelJS.Workbook): Promise<any[]> {
    const preparedInputWorkbook = await this.supplementInput(workbook);
    const worksheet = preparedInputWorkbook.getWorksheet('Input');
    const rows = [];

    const colByIndexOptions: Record<string, string> = {
      D: 'companyName',
      E: 'contactPerson',
      F: 'contactPersonEmail',
      I: 'website',
    };

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const rowData = {};

      for (const [key, value] of Object.entries(colByIndexOptions)) {
        const targetCell = row.getCell(key);
        rowData[value] = targetCell.value;
      }

      rows.push(rowData);
    });

    // console.log('@@rows : ', rows);
    return rows;
  }

  //* This function need to change (prepare) input file for further actions
  async supplementInput(workbook: ExcelJS.Workbook): Promise<ExcelJS.Workbook> {
    const worksheet = workbook.getWorksheet('Input');
    const endRow = worksheet.rowCount;

    for (let index = 2; index <= endRow; index++) {
      //*** STEP 1 (Company officers retrieve)
      const row = worksheet.getRow(index);
      const companyId = row.getCell('V').value;
      console.log('@@ companyId: ', companyId);

      const { officers = [] } = await this.getCompanyOfficers(
        companyId as string,
      );

      if (!officers.length) {
        continue;
      }

      const officersString = officers
        .map((item) => `- ${item.name} (${item.appointedDate})`)
        .join('\n');
      row.getCell('X').value = officersString;

      const cellE = row.getCell('E');
      const contactPerson = (cellE.value as string)?.trim();

      if (!contactPerson) {
        cellE.value = officers[0]?.name ?? '';
      } else {
        cellE.value = removeMiddleName(contactPerson);
      }

      //*** STEP 2 (Hunter email retrieve)
      const domain = row.getCell('I').value as string;
      const mappedNames = Array.from(
        new Set(
          `- ${cellE.value} ${officersString}`
            .split('-')
            .map((str) => str.replace(/[^A-Za-z\s]/g, ''))
            .map((str) => str.toLowerCase().trim())
            .filter(Boolean),
        ),
      );
      const companyEmailResp = await this.getCompanyEmail(mappedNames, domain);
      // console.log('@@ companyEmailResp: ', companyEmailResp);
      row.getCell('F').value = companyEmailResp.email;
      row.getCell('E').value = companyEmailResp.person;
    }

    return workbook;
  }

  private formatOutputDate(date: Date) {
    let second = date.getSeconds();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    const insuredDay = day < 10 ? '0' + day : day;
    const insuredMonth = month < 10 ? '0' + month : month;
    const insuredSecond = second < 10 ? '0' + second : second;

    return `${year}-${insuredMonth}-${insuredDay}-${insuredSecond}`;
  }

  private async getCompanyOfficers(companyId: string) {
    try {
      const resp = await this.httpRepository.getCompanyOfficers(companyId);
      const mappedOfficers = resp.officers
        .filter((item) => item.role === 'director')
        .reverse()
        .map((item) => ({ ...item, name: removeMiddleName(item.name) }));

      // console.log('@@ COM OFF RESP: ', {
      //   companyId: resp.companyId,
      //   officers: mappedOfficers,
      // });
      return {
        companyId: resp.companyId,
        officers: mappedOfficers,
      };
    } catch (error) {
      return {
        companyId,
        officers: [],
      };
    }
  }

  async getCompanyEmail(names: string[], domain: string) {
    if (this.emailRequestCount >= this.emailRequestLimit) {
      console.log(
        `Email request limit (${this.emailRequestLimit}) reached for this file`,
      );
      return {
        email: '[no email found, limit reached]',
        person: names[0] || '[no person found]',
      };
    }
    this.emailRequestCount++;

    // console.log('@@ mappedNames: ', names);
    for (const name of names) {
      const splittedFullName = name.split(' ');

      let email: string;
      let score: number;
      let verification: string;
      try {
        ({ email, score, verification } =
          await this.httpRepository.getCompanyEmail({
            firstName: splittedFullName[0],
            lastName: splittedFullName[1],
            domain,
          }));
        console.log('@@ HUNTER email : ', email);
        console.log('@@ HUNTER score : ', score);
        console.log('@@ HUNTER verification : ', verification);
      } catch (error) {
        continue;
      }

      if (!email) {
        continue;
      }

      if (
        verification === 'valid' ||
        (verification === 'accept_all' && +score > 85)
      ) {
        console.log('@@ MATCHED PERSON: ', name);
        return { email, person: name };
      }
    }

    return { email: '[no email found]', person: names[0] };
  }
}
