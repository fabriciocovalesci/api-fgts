import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ValidateCpfListUseCase } from './use-cases/validate-cpf-list.use-case';
import { NoValidCpfException } from './exceptions/no-valid-cpf.exception'; 
import { ConfigService } from '@nestjs/config';
import { ExternalApiService } from 'src/external-api/external-api.service';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'json2csv';
import Bottleneck from 'bottleneck';
import { cpf } from 'cpf-cnpj-validator'; 

enum Status {
  VERDE = 'VERDE',
  AMARELO = 'AMARELO',
  VERMELHO = 'VERMELHO',
}


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


  validFormatCPF(cpfList: string[]): string[] {
    const validCpfs = cpfList
    .map((getCPF) => getCPF.replace(/[\.\-]/g, "")) 
    .filter((cleanedCPF) => cpf.isValid(cleanedCPF)); 
    return validCpfs;
  }

  private saveToCsv_bkp(data: any[], fileName: string): string {
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
  
      const opts = { fields: fixedHeaders, delimiter: ';' };
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
  
  private saveToCsv(data: any[], fileName: string): string {
    try {
      const fixedHeaders = [
        'CPF',
        'SALDO TORAL BRUTO',
        'SALDO LIQUIDO ',
        'UY3 STATUS',
        'UY3 MENSAGEM',
        'UY3 MENSAGEM DETALHADA',
        'DATA'
      ];

      const formattedData = data.map((item) => {
        const formattedItem: any = {};
        fixedHeaders.forEach((header) => {
          formattedItem[header] = item[header] !== undefined ? item[header] : '';
        });
        return formattedItem;
      });
  
      const opts = { fields: fixedHeaders, delimiter: ';' };
      const csvData = parse(formattedData, opts);
      const csvWithUtf8Bom = `\uFEFF${csvData}`;
  
      const filePath = path.join(__dirname, '../../exports', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
  
      if (fs.existsSync(filePath)) {
        this.logger.log(`Arquivo existente encontrado: ${filePath}`);
        const existingCsv = fs.readFileSync(filePath, 'utf8');

        const existingLines = existingCsv.replace(/^\uFEFF/, '').split('\n');
        const newLines = csvWithUtf8Bom.replace(/^\uFEFF/, '').split('\n').slice(1);
        const combinedCsv = [existingLines[0], ...existingLines.slice(1), ...newLines]
          .filter((line, index, array) => array.indexOf(line) === index)
          .join('\n');
  
        fs.writeFileSync(filePath, combinedCsv, 'utf8');
      } else {
        fs.writeFileSync(filePath, csvWithUtf8Bom, 'utf8');
      }
  
      this.logger.log(`Arquivo CSV atualizado/salvo em: ${filePath}`);
      return filePath;
    } catch (err) {
      this.logger.error('Erro ao gerar CSV:', err);
      throw new Error('Falha ao salvar arquivo CSV');
    }
  }
  
  

  private processJsonData(jsonData: any | any[], isBatch: boolean, noBatch: boolean): any[] {
    const currentDateTime = new Date().toISOString();
  
    const AUTHORIZED = 'Autorizado';
    const UNAUTHORIZED = 'Nao Autorizado';
  
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
  
    return dataArray.map((item) => {
      const processedItem: any = {
        CPF: '',
        'SALDO TORAL BRUTO': '',
        'SALDO LIQUIDO': '',
        'UY3 STATUS': '',
        'UY3 MENSAGEM': '',
        'UY3 MENSAGEM DETALHADA': '',
        DATA: currentDateTime,
      };
  
      if (item?.error?.code === 'INVALID_AMORTIZATION_QUERY_MINIMUM_PRINCIPAL_FOR_PRODUCT') {
        processedItem.CPF = item?.cpf || '';
        processedItem['SALDO TORAL BRUTO'] = "";
        processedItem['SALDO LIQUIDO '] = "";
        processedItem['UY3 STATUS'] = UNAUTHORIZED;
        processedItem['UY3 MENSAGEM DETALHADA'] = item?.error.details?.reason || item?.error.message || '';
        processedItem['UY3 MENSAGEM'] = 'CPF autorizado';
      } else if (item?.error?.code) {
        processedItem.CPF = item?.cpf || '';
        processedItem['SALDO TORAL BRUTO'] = "";
        processedItem['SALDO LIQUIDO '] = "";
        processedItem['UY3 STATUS'] = UNAUTHORIZED;
        processedItem['UY3 MENSAGEM DETALHADA'] = item?.error.details?.reason || item?.error.message || '';
        processedItem['UY3 MENSAGEM'] = 'CPF nao autorizado';
      } else {
        processedItem['UY3 STATUS'] = AUTHORIZED;
  
        const data = isBatch ? item.value : item.data || {};
        const registrationNumber = isBatch ? item.value?.registrationNumber : item.cpf;
        const formattedStartDate = data?.startDate ? new Date(data.startDate).toLocaleDateString('pt-BR') : '';

        processedItem.CPF = registrationNumber || '';
        processedItem['SALDO TORAL BRUTO'] = data?.initialValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '';
        processedItem['SALDO LIQUIDO '] = data?.liquidValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '';
        processedItem['UY3 MENSAGEM DETALHADA'] = "";
        processedItem['UY3 MENSAGEM'] = `CPF autorizado ate ${formattedStartDate}`;
      }
      return processedItem;
    });
  }
  


private checkStatus(data: any): string {
  if (data && data.code === "INVALID_AMORTIZATION_QUERY_MINIMUM_PRINCIPAL_FOR_PRODUCT") {
    return Status.AMARELO;
  }
  if (data?.id) {
    return Status.VERDE;
  }
  return Status.VERMELHO;
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

  async processCpfListAndConsultExternalApi_bkp(
    cpfList: string[],
    delay: number,
    timeout: number,
    rateLimitPoints: number,
    rateLimitDuration: number,
    productId: string,
    teimosinha: number,
    onResultCallback: (cpf: string, result: any) => void
  ) {
    const validCpfs = this.validFormatCPF(cpfList);
  
    if (validCpfs.length === 0) {
      this.logger.error('Nenhum CPF válido encontrado');
      throw new NoValidCpfException();
    }
  
    for (const cpf of validCpfs) {
      let success = false;
      let attempts = 0;
      let lastError = null;
  
      while (!success && attempts < teimosinha) {
        attempts++;
        try {
          this.logger.log(`Tentativa ${attempts} para o CPF ${cpf}`);
          const data = await this.consultSimulation.simulationFGTS(
            productId,
            cpf,
            timeout,
            delay,
            rateLimitPoints,
            rateLimitDuration
          );
  
          if (data?.code) {
            // A API retornou um erro (data.code indica erro)
            lastError = data;
            this.logger.warn(`Erro retornado pela API para o CPF ${cpf}: ${data.code}`);
          } else {
            // Sucesso: envia o resultado e encerra as tentativas
            this.logger.log(`CPF ${cpf} consultado com sucesso na tentativa ${attempts}`);
            onResultCallback(cpf, { success: true, data });
            success = true;
          }
        } catch (error) {
          // Exceção durante a consulta
          lastError = { error: error.message };
          this.logger.error(`Erro ao consultar CPF ${cpf} na tentativa ${attempts}: ${error.message}`);
        }
      }
  
      if (!success && lastError) {
        // Envia o último erro após todas as tentativas falharem
        this.logger.error(`Todas as tentativas falharam para o CPF ${cpf}`);
        onResultCallback(cpf, { success: false, error: lastError });
      }
    }
  
    this.logger.log('Processamento de CPFs concluído');
  }
  
  async processCpfListAndConsultExternalApi(
    cpfList: string[],
    delay: number,
    timeout: number,
    rateLimitPoints: number,
    rateLimitDuration: number,
    productId: string,
    teimosinha: number,
    onResultCallback: (cpf: string, result: any) => void
  ) {
    const validCpfs = this.validFormatCPF(cpfList);
  
    if (validCpfs.length === 0) {
      this.logger.error('Nenhum CPF válido encontrado');
      throw new NoValidCpfException();
    }
  
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `consultas-${timestamp}.csv`;
  
    for (const cpf of validCpfs) {
      let attempts = 0;
      let lastResult = null;
  
      while (attempts < teimosinha) {
        attempts++;
        try {
          this.logger.log(`Tentativa ${attempts} para o CPF ${cpf}`);
          const data = await this.consultSimulation.simulationFGTS(
            productId,
            cpf,
            timeout,
            delay,
            rateLimitPoints,
            rateLimitDuration
          );
  
          const status = this.checkStatus(data);
  
          if (status === Status.VERDE) {
            lastResult = { cpf, success: true, status, data };
            break; 
          } else {
            lastResult = { cpf, success: false, status, error: data };
          }
        } catch (error) {
          this.logger.error(`Erro ao consultar CPF ${cpf} na tentativa ${attempts}: ${error.message}`);
          lastResult = { cpf, success: false, status: 'ERROR', error: error.message };
        }
      }
  
      if (lastResult) {
        const processedData = this.processJsonData([lastResult], false, true);
        this.saveToCsv(processedData, fileName);
  
        onResultCallback(cpf, { ...lastResult, csvFile: fileName });
      }
    }
    this.logger.log('Todos os CPFs foram processados');
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
  const fileName = `consultas-${timestamp}.csv`;

  this.saveToCsv(result, fileName);
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
  this.saveToCsv(this.processJsonData(result, true, false), fileName);

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


    Lista de cpf, com . ou - sem . ou - cpf sem 0 no inico ou com 0 no inicio completar -ok
Dar o resultado em tempo real conforme for consultando -ok 
Poder pausar a consulta e continuar - andamento
Poder programar a consulta para data e hora expecifica 
Historico de consultas
Poder recuperar o arquivo cosultado para evitar perdas 
Poder ajustar o tamanho da consulta em lote, no caso está 10 fixo, precisamos poder controlar de 1 a 15 por lote
Delay por lote 
Timeout por lote
Indicador de consultas acertivas e erros em tempo real, apenas numero de cada em somatoria 
progressão da consulta (pode ser em numero ou %)
Quantos cpf está incluso na consulta


Verde = Cliente "autorizado" com saldo Disponivel para fazer a operação
Amarelo = Cliente "não autorizado"
Vermelho = Cliente "autorizado" ou "não autorizado" que por algum motivo não ficou no verde ou no amarelo

*/