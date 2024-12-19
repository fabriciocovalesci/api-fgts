
import { Controller, Post, Get, Param, Body, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { CpfService } from './cpf.service';
import { RequestDto } from './dto/request.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import * as path from 'path';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParser from 'csv-parser';
import { Express } from 'express';


@Controller('fgts')
export class CpfController {
  constructor(private readonly cpfService: CpfService) {}

  @Post('produtos')
  // @UseGuards(JwtAuthGuard)
  async listProdudts(@Body() requestDto: RequestDto) {
    return await this.cpfService.getProductsExternalApi(
      requestDto.delay, 
      requestDto.timeout,
      requestDto.rateLimitPoints,
      requestDto.rateLimitDuration
    );
  }



  @Post('consultar-cpf')
  // @UseGuards(JwtAuthGuard)
  async consultarCpf(@Body() requestDto: RequestDto) {
    return await this.cpfService.processCpfListAndConsultExternalApi(
      requestDto.cpfList, 
      requestDto.delay, 
      requestDto.timeout,
      requestDto.rateLimitPoints,
      requestDto.rateLimitDuration,
      requestDto.productName
    );
  }


  @Post('consultar-batch')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async consultarCpfBatch(@UploadedFile() file: Express.Multer.File, @Body() requestDto: RequestDto) {
    if (!file) {
      throw new Error('File is required');
    }

    const cpfs = await this.parseCsv(file);

    return await this.cpfService.processCpfBatchAndConsultExternalApi(
    //   cpfs,
    //   requestDto.delay,
    //   requestDto.timeout,
    //   requestDto.rateLimitPoints,
    //   requestDto.rateLimitDuration,
    //   requestDto.productName
    );
  }


  private async parseCsv(file: Express.Multer.File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const cpfs: string[] = [];
      const stream = fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (row) => {
          if (row.cpf) {
            cpfs.push(row.cpf);
          }
        })
        .on('end', () => {
          resolve(cpfs);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  @Get('download-csv/:fileName')
  // @UseGuards(JwtAuthGuard)
  async downloadCsv(@Param('fileName') fileName: string, @Res() res) {
    const filePath = path.join(__dirname, '../../exports', fileName);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('Arquivo não encontrado');
    }
  }
}
