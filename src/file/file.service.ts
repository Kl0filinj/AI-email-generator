import {
  CompanyOfficersResponseDto,
  HttpRepository,
  removeMiddleName,
} from '@libs';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { join } from 'path';

@Injectable()
export class FileService {
  private readonly uploadDir = join(process.cwd(), 'src/uploads');

  constructor(private readonly httpRepository: HttpRepository) {}

  async generateOutput(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Output');
    const parsedInputData = await this.parseExcel(file.buffer);

    const baseColWidth = 30;
    worksheet.columns = [
      { header: 'Company Name', key: 'companyName', width: baseColWidth },
      {
        header: 'Company Name ???',
        key: 'companyNameFooBar',
        width: baseColWidth,
      },
      { header: 'Contact Person', key: 'contactPerson', width: baseColWidth },
      { header: 'Industry', key: 'industry', width: baseColWidth },
      {
        header: 'Industry Advantages',
        key: 'industryAdv',
        width: baseColWidth,
      },
      {
        header: 'Website Information',
        key: 'websiteInfo',
        width: baseColWidth,
      },
      { header: 'LinkedIn Link', key: 'linkedinLink', width: baseColWidth },
      {
        header: 'Linkedin Informationen',
        key: 'LinkedinInfo',
        width: baseColWidth,
      },
      { header: 'Total Cost in $', key: 'totalCost', width: baseColWidth },
      { header: 'Email', key: 'contactPersonEmail', width: baseColWidth + 5 },
      { header: 'Error', key: 'error', width: baseColWidth },
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 15,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF279127' },
      };
    });

    for (const data of parsedInputData) {
      worksheet.addRow(data);
    }

    const fileName = `output-${this.formatOutputDate(new Date())}.xlsx`;
    await workbook.xlsx.writeFile(`${this.uploadDir}/${fileName}`);
    return fileName;
  }

  //* This function need to change (prepare) input file for further actions
  async prepareInput(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
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
      const companyEmailResp = await this.getCompanyEmail(
        `- ${cellE.value} ${officersString}`,
        domain,
      );
      console.log('@@ companyEmailResp: ', companyEmailResp);
      row.getCell('F').value = companyEmailResp.email;
      row.getCell('E').value = companyEmailResp.person;
    }

    // TODO: CAHNGE TO BUFFER AFTER TEST ⬇️
    const fileName = `input-${this.formatOutputDate(new Date())}.xlsx`;
    await workbook.xlsx.writeFile(`${this.uploadDir}/${fileName}`);
    return fileName;
  }

  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const preparedInput = await this.prepareInput(buffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(preparedInput as unknown as Buffer); // TODO: REMOVE THIS 'as' after test prepareInput
    const worksheet = workbook.getWorksheet(1);
    const rows = [];

    const colByIndexOptions: Record<number, string> = {
      1: 'companyName',
      2: 'contactPerson',
      3: 'contactPersonEmail',
      4: 'website',
    };
    const colLimitIndex = Math.max(
      ...Object.keys(colByIndexOptions).map((item) => +item),
    );

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const rowData = {};

      row.eachCell((cell, colIndex) => {
        if (colIndex > colLimitIndex) {
          return;
        }
        const key = colByIndexOptions[colIndex];
        const value = cell.value;
        rowData[key] = value;
      });
      rows.push(rowData);
    });

    // console.log('@@rows : ', rows);
    return rows;
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

      console.log('@@ COM OFF RESP: ', {
        companyId: resp.companyId,
        officers: mappedOfficers,
      });
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

  async getCompanyEmail(names: string, domain: string) {
    const mappedNames = Array.from(
      new Set(
        names
          .split('-')
          .map((str) => str.replace(/[^A-Za-z\s]/g, ''))
          .map((str) => str.toLowerCase().trim())
          .filter(Boolean),
      ),
    );

    console.log('@@ mappedNames: ', mappedNames);
    for (const name of mappedNames) {
      const splittedFullName = name.split(' ');

      let email: string;
      let score: number;
      let verification: string;
      try {
        let { email, score, verification } =
          await this.httpRepository.getCompanyEmail({
            firstName: splittedFullName[0],
            lastName: splittedFullName[1],
            domain,
          });
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
        return { email, person: name };
      }
    }

    return { email: '[no email found]', person: mappedNames[0] };
  }
}
