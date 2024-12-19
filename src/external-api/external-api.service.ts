import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from 'src/http/http.service';

@Injectable()
export class ExternalApiService {
  private enpoint: string;
  private readonly logger = new Logger(ExternalApiService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.enpoint = this.configService.get('BASE_URL')
  }


  private config(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number) {
    return {
      timeout: timeout,
      delay: delay,
      rateLimitPoints: rateLimitPoints,
      rateLimitDuration: rateLimitDuration
    };
  }


  public async getProducts(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any> {
    this.logger.log('Searching for products');
    const products = await this.httpService.get(
      `${this.enpoint}/v1/Product`,
      this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
      delay,
      timeout
    );

    this.logger.log('Products found');
    return products.data;
  }


  public async getProductByNames(productName: string, timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any> {
    this.logger.log(`Searching for product ${productName}`);
    const listProducts = await this.httpService.get(
      `${this.enpoint}/v1/Product`,
      this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
      delay,
      timeout
    );

    const product = listProducts?.data.find((product: any) => product.name === productName);
    if (!product) {
      this.logger.error(`Product ${productName} not found`);
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    this.logger.log(`Product ${productName} found`);
    return {
      id: product.id,
      minimumInterestRate: product.minimumInterestRate
    }
  }


  public async simulationFGTS(
    productName: string, 
    cpf: string, 
    timeout: number, 
    delay: number, 
    rateLimitPoints: number, 
    rateLimitDuration: number
  ): Promise<any> {
    this.logger.log(`Simulating FGTS for CPF: ${cpf}`);
  
    try {
      const product = await this.getProductByNames(productName, timeout, delay, rateLimitPoints, rateLimitDuration);
  
      const data = {
        amortization: {
          agentCommission: {
            amount: 0,
            type: "Percentage",
            baseValue: "InitialValue"
          },
          apr: product.minimumInterestRate,
          termInMonths: 10,
          startDate: new Date().toISOString(),
          requestedAmount: 0,
          amortizationType: "fgts"
        },
        registrationNumber: cpf,
        personId: null,
        legalPerson: false,
        productId: product.id,
      };
  
      const simulation = await this.httpService.post(
        `${this.enpoint}/v1/Amortization`,
        data,
        this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
        delay,
        timeout,
        rateLimitDuration
      );
  
      this.logger.log(`Simulation FGTS for CPF ${cpf} completed successfully`);
      return simulation;
    } catch (error) {

      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      this.logger.error(`Error during FGTS simulation for CPF ${cpf}: ${errorMessage}`, error.stack);
  
      return {
        cpf,
        error: true,
        message: errorMessage,
        statusCode: error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
  


}
