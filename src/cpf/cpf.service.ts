import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ValidateCpfListUseCase } from './use-cases/validate-cpf-list.use-case';
import { NoValidCpfException } from './exceptions/no-valid-cpf.exception'; 
import { ConfigService } from '@nestjs/config';
import { ExternalApiService } from 'src/external-api/external-api.service';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'json2csv';

@Injectable()
export class CpfService {
  enpoint: string;
  private readonly logger = new Logger(CpfService.name);

  constructor(
    private readonly validateCpfListUseCase: ValidateCpfListUseCase,
    private readonly configService: ConfigService,
    private readonly consultSimulation: ExternalApiService
  ) {
    this.enpoint = this.configService.get('BASE_URL')
  }


  private saveToCsv(data: any[], fileName: string): string {
    try {
      const fields = Object.keys(data[0]);
      const opts = { fields };
      const csv = parse(data, opts);

      const filePath = path.join(__dirname, '../../exports', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, csv, 'utf8');

      this.logger.log(`Arquivo CSV salvo em: ${filePath}`);
      return filePath;
    } catch (err) {
      this.logger.error('Erro ao gerar CSV:', err);
      throw new Error('Falha ao salvar arquivo CSV');
    }
  }


  async getProductsExternalApi(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number) {
    try {
      const products = await this.consultSimulation.getProducts(timeout, delay, rateLimitPoints, rateLimitDuration);
      return products;
    } catch (error) {
      this.logger.error('Erro ao consultar produtos:', error);
      throw new BadRequestException('Erro ao consultar produtos');
    }
  }

  async processCpfListAndConsultExternalApi(
    cpfList: string[], 
    delay: number, 
    timeout: number, 
    rateLimitPoints: number, 
    rateLimitDuration: number,
    productName: string
  ) {

    const validationResults = this.validateCpfListUseCase.validate(cpfList);


    const validCpfs = validationResults.filter(result => result.isValid).map(result => result.cpf);

    if (validCpfs.length === 0) {
      this.logger.error('Nenhum CPF válido encontrado');
      throw new NoValidCpfException()
    }

    let result = [];
    for (const cpf of validCpfs) {
      const data =  await this.consultSimulation.simulationFGTS(productName, cpf, timeout, delay, rateLimitPoints, rateLimitDuration);
      this.logger.log(`CPF ${cpf} consultado com sucesso - ${data}`);
      result.push(data);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `consultas-${timestamp}.csv`;
    this.saveToCsv(result, fileName);

    this.logger.log('Todos os CPFs foram consultados com sucesso');
    return { result, csvFile: fileName };
  }
  

public async processCpfBatchAndConsultExternalApi(
  cpfList: string[],
  delay: number,
  timeout: number,
  rateLimitPoints: number,
  rateLimitDuration: number,
  productId: string,
  minimumInterestRate: number,
  batchSize: number
) {

  const validationResults = this.validateCpfListUseCase.validate(cpfList);
  const validCpfs = validationResults.filter((result) => result.isValid).map((result) => result.cpf);

  if (validCpfs.length === 0) {
    this.logger.error('Nenhum CPF válido encontrado');
    throw new NoValidCpfException();
  }

  const result = [];

  for (let i = 0; i < validCpfs.length; i += batchSize) {
    const batch = validCpfs.slice(i, i + batchSize);

    try {
      this.logger.log(`Processing batch of CPFs: ${batch.join(', ')}`);

      const batchResults = await this.consultSimulation.simulationBatchFGTS(
        minimumInterestRate,
        productId,
        batch,
        timeout,
        delay,
        rateLimitPoints,
        rateLimitDuration
      );

      if (Array.isArray(batchResults)) {
        result.push(...batchResults);
    } else {
        this.logger.error(`Resultados da simulação não são um array: ${JSON.stringify(batchResults)}`);
        if (batchResults && typeof batchResults === 'object') {
          result.push({ batch, error: 'Resultado não é um array', details: batchResults });
        }
      }
    
      if (i + batchSize < validCpfs.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

    } catch (error) {
      this.logger.error(`Erro ao processar lote de CPFs: ${batch.join(', ')}, Erro: ${error.message}`);
      result.push(...batch.map(cpf => ({ cpf, error: error })));
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `consultas-batch-${timestamp}.csv`;

  // this.saveToCsv(result, fileName);
  this.logger.log('Todos os CPFs em lotes foram consultados com sucesso');

  return { result, csvFile: fileName };
}

}
