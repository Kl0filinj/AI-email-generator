import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { join } from 'path';

@Injectable()
export class FileService {
  private readonly uploadDir = join(process.cwd(), 'src/uploads');

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

  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
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
}
