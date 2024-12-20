
import { Controller, Post, Get, Param, Body, UseGuards, UseInterceptors, UploadedFile, Res, Logger, BadRequestException } from '@nestjs/common';
import { CpfService } from './cpf.service';
import { RequestDto } from './dto/request.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import * as path from 'path';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParser from 'csv-parser';
import { Express } from 'express';
import { Readable } from 'stream';


@Controller('fgts')
export class CpfController {
  private readonly logger = new Logger(CpfController.name);
  constructor(private readonly cpfService: CpfService) {}

  @Post('produtos')
  @UseGuards(JwtAuthGuard)
  async listProdudts(@Body() requestDto: RequestDto) {
    return await this.cpfService.getProductsExternalApi(
      requestDto.delay, 
      requestDto.timeout,
      requestDto.rateLimitPoints,
      requestDto.rateLimitDuration
    );
  }



  @Post('consultar-cpf')
  @UseGuards(JwtAuthGuard)
  async consultarCpf(@Body() requestDto: RequestDto) {
    return await this.cpfService.processCpfListAndConsultExternalApi(
      requestDto.cpfList, 
      requestDto.delay, 
      requestDto.timeout,
      requestDto.rateLimitPoints,
      requestDto.rateLimitDuration,
      requestDto.productId
    );
  }


  @Post('consultar-batch')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async consultarCpfBatch(@UploadedFile() file: Express.Multer.File, @Body() requestDto: any) {
    if (!file) {
      throw new Error('File is required');
    }

    this.logger.log(`File received: ${file.originalname}`);

    const cpfs = await this.parseCsv(file);
    if (cpfs.length === 0) {
      throw new BadRequestException('No valid CPFs found in file');
    }

    return await this.cpfService.processCpfBatchAndConsultExternalApi(
      cpfs,
      requestDto.delay,
      requestDto.timeout,
      requestDto.rateLimitPoints,
      requestDto.rateLimitDuration,
      requestDto.productId,
      parseFloat(requestDto.minimumInterestRate),
      requestDto.batchSize
    );
  }


  private async parseCsv(file: Express.Multer.File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const cpfs = new Set<string>();
      const stream = Readable.from(file.buffer)
        .pipe(csvParser())
        .on('data', (row) => {
          if (row.cpf) {
            const normalizedCpf = /^\d{11}$/.test(row.cpf) 
              ? row.cpf 
              : row.cpf.replace(/\D/g, '');
  
            if (/^\d{11}$/.test(normalizedCpf)) {
              cpfs.add(normalizedCpf);
            }
          }
        })
        .on('end', () => {
          resolve(Array.from(cpfs));
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  

  @Get('download-csv/:fileName')
  @UseGuards(JwtAuthGuard)
  async downloadCsv(@Param('fileName') fileName: string, @Res() res) {
    const filePath = path.join(__dirname, '../../exports', fileName);
    this.logger.log(`Download requested for file: ${filePath}`);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('Arquivo não encontrado');
    }
  }
}

