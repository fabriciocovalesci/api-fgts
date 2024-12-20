import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ValidateCpfListUseCase } from './use-cases/validate-cpf-list.use-case';
import { NoValidCpfException } from './exceptions/no-valid-cpf.exception'; 
import { ConfigService } from '@nestjs/config';
import { ExternalApiService } from 'src/external-api/external-api.service';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'json2csv';
import Bottleneck from 'bottleneck';


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
      const fixedHeaders = [
        'CPF',
        'facta_offline_saldo',
        'facta_offline_lib',
        'facta_offline_message',
        'facta_offline_finished_at',
        'facta_saldo',
        'facta_lib',
        'facta_message',
        'facta_finished_at'
      ];
  
      const formattedData = data.map((item) => {
        const formattedItem: any = {};
        fixedHeaders.forEach((header) => {
          formattedItem[header] = item[header] !== undefined ? item[header] : '';
        });
        return formattedItem;
      });
  
      const opts = { fields: fixedHeaders };
      const csv = parse(formattedData, opts);
  
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
  

  private processJsonData(jsonData: any[], isBatch: boolean): any[] {
    const currentDateTime = new Date().toISOString();

    const AUTHORIZED = 'Autorizado';
    const UNAUTHORIZED = 'Não Autorizado';

    return jsonData.map((item) => {
      const processedItem: any = {
        CPF: '',
        facta_offline_saldo: '',
        facta_offline_lib: '',
        facta_offline_message: '',
        facta_offline_finished_at: currentDateTime,
        facta_saldo: '',
        facta_lib: '',
        facta_message: '',
        facta_finished_at: currentDateTime,
      };

      if (item.code) {
        processedItem.CPF = item.details?.registrationNumber || '';
        processedItem.facta_offline_saldo = UNAUTHORIZED;
        processedItem.facta_offline_lib = UNAUTHORIZED;
        processedItem.facta_message = item.details?.reason || item?.message || "";
        processedItem.facta_offline_message = 'CPF não autorizado'
      } else {
        processedItem.facta_offline_saldo = AUTHORIZED;
        processedItem.facta_offline_lib = AUTHORIZED;

        const initialValue = isBatch ? item.value.initialValue : item.initialValue;
        const liquidValue = isBatch ? item.value.liquidValue : item.liquidValue;
        const startDate = isBatch ? item.value.startDate : item.startDate;
        const registrationNumber = isBatch ? item.value.registrationNumber : item.registrationNumber;
        processedItem.CPF = registrationNumber;
        processedItem.facta_saldo = (initialValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        processedItem.facta_lib = (liquidValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
        if (startDate) {
          const formattedDate = new Date(startDate).toLocaleDateString('pt-BR');
          processedItem.facta_offline_message += `CPF autorizado até ${formattedDate}`;
        }
        
      }

      return processedItem;
    });
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
    this.saveToCsv(this.processJsonData(result, false), fileName);

    this.logger.log('Todos os CPFs foram consultados com sucesso');
    return { result, csvFile: fileName };
  }
  

public async processCpfBatchAndConsultExternalApiBKP(
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
        timeout + (1000 * batch.length),
        delay,
        rateLimitPoints,
        rateLimitDuration
      );

      console.log('batchResults', batchResults);
      if (Array.isArray(batchResults)) {
        result.push(...batchResults);
    } else {
        this.logger.error(`Resultados da simulação não são um array: ${JSON.stringify(batchResults)}`);
        if (batchResults && typeof batchResults === 'object') {
          result.push({ batch, error: 'Resultado não é um array', details: batchResults });
        }
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

  const limiter = new Bottleneck({
    maxConcurrent: batchSize, 
    minTime: rateLimitDuration / rateLimitPoints, 
  });

  const result = [];

  const limitedSimulationBatchFGTS = limiter.wrap(
    async (batch: string[]) => {
      try {
        this.logger.log(`Processing batch of CPFs: ${batch.join(', ')}`);
        const batchResults = await this.consultSimulation.simulationBatchFGTS(
          minimumInterestRate,
          productId,
          batch,
          timeout + batch.length,
          delay,
          rateLimitPoints,
          rateLimitDuration
        );

        if (Array.isArray(batchResults)) {
          return batchResults;
        } else {
          this.logger.error(`Resultados da simulação não são um array: ${JSON.stringify(batchResults)}`);
          return { batch, error: 'Resultado não é um array', details: batchResults };
        }
      } catch (error) {
        this.logger.error(`Erro ao processar lote de CPFs: ${batch.join(', ')}, Erro: ${error.message}`);
        return batch.map((cpf) => ({ cpf, error: error.message }));
      }
    }
  );

  const promises = [];
  for (let i = 0; i < validCpfs.length; i += batchSize) {
    const batch = validCpfs.slice(i, i + batchSize);
    promises.push(limitedSimulationBatchFGTS(batch));
  }

  const resolvedBatches = await Promise.all(promises);
  resolvedBatches.forEach((batchResult) => result.push(...batchResult));


  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `consultas-${timestamp}.csv`;
  this.saveToCsv(this.processJsonData(result, true), fileName);

  this.logger.log('Todos os CPFs em lotes foram consultados com sucesso');
  return { result, csvFile: fileName };
}

}


/*
CPF	facta_offline_saldo	facta_offline_lib	facta_offline_message	facta_offline_finished_at	facta_saldo	facta_lib	facta_message	facta_finished_at

"id": "5088c941-7ec7-4ea9-a41f-ac6f041bec62", //Identificador da simulação
"calculateByValueType": "Gross", //Tipo de cálculo de operação: Gross - Valor Bruto ou Liquid - Valor Líquido
"requestedAmount": 0, //Valor solicitado pelo tomador. Quando calculado pelo valor líquido, o valor solicitado é o liquido da operação.
"initialValue": 4914702, //Valor inicial da dívida contraída
"liquidValue": 4705290, //Valor líquido da operação
"monthlyInterest": 0.0204, //Taxa de juros nominal mensal da operação
"yearlyInterest": 0.27422288066567435, //Taxa de juros nominal anual da operação
"startDate": "2023-11-21T12:00:00-03:00", //Data de início da operação
"dueDate": "2033-10-01T00:00:00-03:00", //Data de encerramento da operação (vencimento da última parcela)
"comm": 49147, //Custo de Emissão da operação (soma da comissão do agente e Custo de emissão UY3)
"finTax": 160265, //Valor de IOF da operação
"effectiveMonthlyCost": 0.021795997411120815, //Custo Efetivo Total (CET) Mensal da operação
"effectiveYearlyCost": 0.29529999999999945, //Custo Efetivo Total (CET) Anual da operação
"termInMonths": 10, //Prazo da operação (em meses ou anos, dependendo da periodicidade)
"paymentScheduleItems": [
    {
        "dueDate": "2023-11-21T12:00:00-03:00", //Data de vencimento da parcela
        "principalAmountInCents": 4914702, //Saldo devedor da parcela após a apuração de amortização e juros
        "amortization": 0, //Valor amortizado (principal) na parcela
        "interest": 0, //Juros apurados no período
        "financeTax": 0, //Valor de IOF que incide sob a parcela (IOF diário + parcela do IOF base)
        "payment": 0 //Valor da parcela que será pago pelo devedor no vencimento
    },
*/